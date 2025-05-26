import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faPlus,
  faFileAlt,
  faPaperPlane,
  faUsers,
  faSearch,
  faEye,
  faEdit,
  faTrash,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import FormStorageService from "../../services/FormStorageService";

// TypeScript interfaces
interface FormData {
  formId: number;
  title: string;
  description: string;
  createdDate: string;
  responses: number;
  status: "active" | "draft";
  questionsCount: number;
}

interface StatCard {
  icon: any;
  value: string | number;
  label: string;
  color: string;
}

const FormsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormData[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Load forms from localStorage on component mount
  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = () => {
    try {
      setLoading(true);
      const storedForms = FormStorageService.getForms();
      
      const formattedForms: FormData[] = storedForms.map(form => ({
        formId: form.formId!,
        title: form.title || 'Untitled Form',
        description: form.description || 'No description',
        createdDate: new Date().toLocaleDateString(), // You can store actual creation date later
        responses: 0, // Will be calculated from submissions later
        status: form.isFormSaved ? "active" : "draft",
        questionsCount: form.questions?.length || 0
      }));
      
      setForms(formattedForms);
    } catch (error) {
      console.error('Error loading forms:', error);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from forms
  const stats: StatCard[] = [
    {
      icon: faFileAlt,
      value: forms.length,
      label: "Total Forms",
      color: "primary",
    },
    {
      icon: faPaperPlane,
      value: forms.reduce((sum, form) => sum + form.responses, 0),
      label: "Total Submissions",
      color: "success",
    },
    {
      icon: faUsers,
      value: forms.filter(form => form.status === "active").length,
      label: "Active Forms",
      color: "warning",
    },
  ];

  // Handle form deletion
  const handleDeleteForm = (formId: number) => {
    const form = forms.find(f => f.formId === formId);
    if (window.confirm(`Are you sure you want to delete "${form?.title}"?`)) {
      try {
        const success = FormStorageService.deleteForm(formId);
        if (success) {
          setForms(forms.filter((form) => form.formId !== formId));
          alert('Form deleted successfully!');
        } else {
          alert('Error deleting form. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting form:', error);
        alert('Error deleting form. Please try again.');
      }
    }
  };

  // Filter forms based on search query
  const filteredForms = forms.filter((form) =>
    form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNewForm = () => {
    // Clear any existing form data and navigate to form builder
    localStorage.removeItem('formcraft_current_form');
    localStorage.removeItem('form_name');
    localStorage.removeItem('form_description');
    navigate('/form-builder');
  };

  const handleEditForm = (formId: number) => {
    // Store the form ID to load and navigate to form builder
    localStorage.setItem('formcraft_edit_form_id', formId.toString());
    navigate('/form-builder');
  };

  const handleViewResponses = (formId: number) => {
    // TODO: Navigate to responses view
    alert(`Viewing responses for form ${formId} (Feature coming soon)`);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <div>Loading forms...</div>
      </div>
    );
  }

  return (
    <div
      style={{ fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif" }}
    >
      <header
        style={{
          backgroundColor: "white",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          className="container"
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "15px 0",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#4361ee",
                display: "flex",
                alignItems: "center",
              }}
            >
              <FontAwesomeIcon
                icon={faClipboardList}
                style={{ marginRight: "10px" }}
              />
              FormCraft
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                onClick={loadForms}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #4361ee",
                  color: "#4361ee",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginRight: "10px"
                }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <div style={{ padding: "30px 0", backgroundColor: "#f5f7fb" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "30px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 600,
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                Form Dashboard
              </h1>
              <p
                style={{
                  color: "#adb5bd",
                  marginTop: "5px",
                }}
              >
                Manage your forms and view responses
              </p>
            </div>
            <button
              onClick={handleCreateNewForm}
              style={{
                backgroundColor: "#4361ee",
                color: "white",
                border: "none",
                padding: "12px 25px",
                borderRadius: "6px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: "8px" }} />
              Create New Form
            </button>
          </div>

          {/* Stats cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "20px",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "15px",
                    fontSize: "22px",
                    backgroundColor:
                      stat.color === "primary"
                        ? "rgba(67, 97, 238, 0.1)"
                        : stat.color === "success"
                        ? "rgba(76, 201, 240, 0.1)"
                        : "rgba(248, 150, 30, 0.1)",
                    color:
                      stat.color === "primary"
                        ? "#4361ee"
                        : stat.color === "success"
                        ? "#4cc9f0"
                        : "#f8961e",
                  }}
                >
                  <FontAwesomeIcon icon={stat.icon} />
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    marginBottom: "5px",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    color: "#adb5bd",
                    fontSize: "14px",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "25px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                }}
              >
                Existing Forms ({forms.length})
              </div>
              <div
                style={{
                  position: "relative",
                  width: "300px",
                }}
              >
                <FontAwesomeIcon
                  icon={faSearch}
                  style={{
                    position: "absolute",
                    left: "15px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#adb5bd",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 15px 10px 40px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            {filteredForms.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#adb5bd' 
              }}>
                {forms.length === 0 ? (
                  <div>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                    <h3>No forms yet</h3>
                    <p>Create your first form to get started!</p>
                    <button
                      onClick={handleCreateNewForm}
                      style={{
                        backgroundColor: "#4361ee",
                        color: "white",
                        border: "none",
                        padding: "12px 25px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        cursor: "pointer",
                        marginTop: "16px"
                      }}
                    >
                      Create Your First Form
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3>No forms found</h3>
                    <p>Try adjusting your search query</p>
                  </div>
                )}
              </div>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "15px 20px",
                        borderBottom: "1px solid #eee",
                        color: "#adb5bd",
                        fontWeight: 500,
                      }}
                    >
                      Form Name
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "15px 20px",
                        borderBottom: "1px solid #eee",
                        color: "#adb5bd",
                        fontWeight: 500,
                      }}
                    >
                      Questions
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "15px 20px",
                        borderBottom: "1px solid #eee",
                        color: "#adb5bd",
                        fontWeight: 500,
                      }}
                    >
                      Responses
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "15px 20px",
                        borderBottom: "1px solid #eee",
                        color: "#adb5bd",
                        fontWeight: 500,
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "15px 20px",
                        borderBottom: "1px solid #eee",
                        color: "#adb5bd",
                        fontWeight: 500,
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForms.map((form) => (
                    <tr key={form.formId}>
                      <td
                        style={{
                          padding: "15px 20px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 500,
                            color: "#1e293b",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faFileAlt}
                            style={{
                              marginRight: "10px",
                              color: "#4361ee",
                            }}
                          />
                          <div>
                            <div>{form.title}</div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#adb5bd',
                              marginTop: '2px'
                            }}>
                              {form.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "15px 20px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {form.questionsCount}
                      </td>
                      <td
                        style={{
                          padding: "15px 20px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {form.responses}
                      </td>
                      <td
                        style={{
                          padding: "15px 20px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "5px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 500,
                            backgroundColor:
                              form.status === "active"
                                ? "rgba(76, 201, 240, 0.1)"
                                : "rgba(248, 150, 30, 0.1)",
                            color:
                              form.status === "active" ? "#4cc9f0" : "#f8961e",
                          }}
                        >
                          {form.status === "active" ? "Active" : "Draft"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "15px 20px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                          }}
                        >
                          <button
                            title="View Responses"
                            onClick={() => handleViewResponses(form.formId)}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "none",
                              cursor: "pointer",
                              backgroundColor: "rgba(67, 97, 238, 0.1)",
                              color: "#4361ee",
                            }}
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button
                            title="Edit Form"
                            onClick={() => handleEditForm(form.formId)}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "none",
                              cursor: "pointer",
                              backgroundColor: "rgba(76, 201, 240, 0.1)",
                              color: "#4cc9f0",
                            }}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            title="Delete Form"
                            onClick={() => handleDeleteForm(form.formId)}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "none",
                              cursor: "pointer",
                              backgroundColor: "rgba(247, 37, 133, 0.1)",
                              color: "#f72585",
                            }}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {filteredForms.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "20px",
                }}
              >
                <button
                  style={{
                    width: "35px",
                    height: "35px",
                    borderRadius: "6px",
                    margin: "0 5px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #ddd",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                {/* {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      width: "35px",
                      height: "35px",
                      borderRadius: "6px",
                      margin: "0 5px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border:
                        currentPage === page
                          ? "1px solid #4361ee"
                          : "1px solid #ddd",
                      backgroundColor: currentPage === page ? "#4361ee" : "white",
                      color: currentPage === page ? "white" : "inherit",
                      cursor: "pointer",
                    }}
                  >
                    {page}
                  </button>
                ))} */}
                <button
                  style={{
                    width: "35px",
                    height: "35px",
                    borderRadius: "6px",
                    margin: "0 5px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #ddd",
                    backgroundColor: "white",
                    cursor: "pointer",
                  }}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormsDashboard;