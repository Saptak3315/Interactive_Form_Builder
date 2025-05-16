import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardList, 
  faPlus, 
  faFileAlt, 
  faPaperPlane, 
  faUsers, 
  faChartLine, 
  faSearch, 
  faEye, 
  faEdit, 
  faTrash, 
  faChevronLeft, 
  faChevronRight 
} from '@fortawesome/free-solid-svg-icons';

// TypeScript interfaces
interface FormData {
  id: number;
  name: string;
  createdDate: string;
  responses: number;
  status: 'active' | 'draft';
}

interface StatCard {
  icon: any;
  value: string | number;
  label: string;
  color: string;
}

const Test: React.FC = () => {
  // Sample data
  const [forms, setForms] = useState<FormData[]>([
    {
      id: 1,
      name: 'Customer Feedback Survey',
      createdDate: 'May 10, 2025',
      responses: 42,
      status: 'active'
    },
    {
      id: 2,
      name: 'Product Interest Quiz',
      createdDate: 'May 8, 2025',
      responses: 38,
      status: 'active'
    },
    {
      id: 3,
      name: 'Employee Satisfaction',
      createdDate: 'May 5, 2025',
      responses: 27,
      status: 'active'
    },
    {
      id: 4,
      name: 'Event Registration Form',
      createdDate: 'May 2, 2025',
      responses: 35,
      status: 'draft'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Stats data
  const stats: StatCard[] = [
    {
      icon: faFileAlt,
      value: 12,
      label: 'Total Forms',
      color: 'primary'
    },
    {
      icon: faPaperPlane,
      value: 142,
      label: 'Total Submissions',
      color: 'success'
    },
    {
      icon: faUsers,
      value: 89,
      label: 'Unique Respondents',
      color: 'warning'
    },
    {
      icon: faChartLine,
      value: '65%',
      label: 'Completion Rate',
      color: 'danger'
    }
  ];

  // Handle form deletion
  const handleDeleteForm = (id: number) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      setForms(forms.filter(form => form.id !== id));
    }
  };

  // Filter forms based on search query
  const filteredForms = forms.filter(form => 
    form.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div className="container" style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '15px 0'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#4361ee',
              display: 'flex',
              alignItems: 'center'
            }}>
              <FontAwesomeIcon icon={faClipboardList} style={{ marginRight: '10px' }} />
              FormCraft
            </div>
            {/* <nav>
              <ul style={{
                display: 'flex',
                listStyle: 'none',
                margin: 0,
                padding: 0
              }}>
                <li style={{ marginLeft: '25px' }}>
                  <a href="#" style={{
                    color: '#1e293b',
                    textDecoration: 'none',
                    fontWeight: 500
                  }}>Dashboard</a>
                </li>
                <li style={{ marginLeft: '25px' }}>
                  <a href="#" style={{
                    color: '#1e293b',
                    textDecoration: 'none',
                    fontWeight: 500
                  }}>Templates</a>
                </li>
                <li style={{ marginLeft: '25px' }}>
                  <a href="#" style={{
                    color: '#1e293b',
                    textDecoration: 'none',
                    fontWeight: 500
                  }}>Settings</a>
                </li>
                <li style={{ marginLeft: '25px' }}>
                  <a href="#" style={{
                    color: '#1e293b',
                    textDecoration: 'none',
                    fontWeight: 500
                  }}>Help</a>
                </li>
              </ul>
            </nav> */}
            <div style={{
              display: 'flex',
              alignItems: 'center'
            }}>
              {/* <img 
                src="/api/placeholder/40/40" 
                alt="User Profile" 
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  marginRight: '10px'
                }} 
              /> */}
              {/* <span>John Doe</span> */}
            </div>
          </div>
        </div>
      </header>

      <div style={{ padding: '30px 0', backgroundColor: '#f5f7fb' }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 600,
                color: '#1e293b',
                margin: 0
              }}>Form Dashboard</h1>
              <p style={{
                color: '#adb5bd',
                marginTop: '5px'
              }}>Manage your forms and view responses</p>
            </div>
            <button style={{
              backgroundColor: '#4361ee',
              color: 'white',
              border: 'none',
              padding: '12px 25px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}>
              <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
              Create New Form
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {stats.map((stat, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '15px',
                  fontSize: '22px',
                  backgroundColor: stat.color === 'primary' ? 'rgba(67, 97, 238, 0.1)' :
                                   stat.color === 'success' ? 'rgba(76, 201, 240, 0.1)' :
                                   stat.color === 'warning' ? 'rgba(248, 150, 30, 0.1)' :
                                   'rgba(247, 37, 133, 0.1)',
                  color: stat.color === 'primary' ? '#4361ee' :
                         stat.color === 'success' ? '#4cc9f0' :
                         stat.color === 'warning' ? '#f8961e' :
                         '#f72585'
                }}>
                  <FontAwesomeIcon icon={stat.icon} />
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  marginBottom: '5px'
                }}>{stat.value}</div>
                <div style={{
                  color: '#adb5bd',
                  fontSize: '14px'
                }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '25px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '20px',
                fontWeight: 600
              }}>Existing Forms</div>
              <div style={{
                position: 'relative',
                width: '300px'
              }}>
                <FontAwesomeIcon icon={faSearch} style={{
                  position: 'absolute',
                  left: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#adb5bd'
                }} />
                <input
                  type="text"
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 15px 10px 40px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr>
                  <th style={{
                    textAlign: 'left',
                    padding: '15px 20px',
                    borderBottom: '1px solid #eee',
                    color: '#adb5bd',
                    fontWeight: 500
                  }}>Form Name</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '15px 20px',
                    borderBottom: '1px solid #eee',
                    color: '#adb5bd',
                    fontWeight: 500
                  }}>Created Date</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '15px 20px',
                    borderBottom: '1px solid #eee',
                    color: '#adb5bd',
                    fontWeight: 500
                  }}>Responses</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '15px 20px',
                    borderBottom: '1px solid #eee',
                    color: '#adb5bd',
                    fontWeight: 500
                  }}>Status</th>
                  <th style={{
                    textAlign: 'left',
                    padding: '15px 20px',
                    borderBottom: '1px solid #eee',
                    color: '#adb5bd',
                    fontWeight: 500
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredForms.map(form => (
                  <tr key={form.id}>
                    <td style={{
                      padding: '15px 20px',
                      borderBottom: '1px solid #eee'
                    }}>
                      <div style={{
                        fontWeight: 500,
                        color: '#1e293b',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <FontAwesomeIcon icon={faFileAlt} style={{
                          marginRight: '10px',
                          color: '#4361ee'
                        }} />
                        {form.name}
                      </div>
                    </td>
                    <td style={{
                      padding: '15px 20px',
                      borderBottom: '1px solid #eee'
                    }}>{form.createdDate}</td>
                    <td style={{
                      padding: '15px 20px',
                      borderBottom: '1px solid #eee'
                    }}>{form.responses}</td>
                    <td style={{
                      padding: '15px 20px',
                      borderBottom: '1px solid #eee'
                    }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: form.status === 'active' ? 
                          'rgba(76, 201, 240, 0.1)' : 'rgba(248, 150, 30, 0.1)',
                        color: form.status === 'active' ? '#4cc9f0' : '#f8961e'
                      }}>
                        {form.status === 'active' ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td style={{
                      padding: '15px 20px',
                      borderBottom: '1px solid #eee'
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '10px'
                      }}>
                        <button
                          title="View Responses"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: 'rgba(67, 97, 238, 0.1)',
                            color: '#4361ee'
                          }}
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          title="Edit Form"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: 'rgba(76, 201, 240, 0.1)',
                            color: '#4cc9f0'
                          }}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          title="Delete Form"
                          onClick={() => handleDeleteForm(form.id)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: 'rgba(247, 37, 133, 0.1)',
                            color: '#f72585'
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

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '20px'
            }}>
              <button style={{
                width: '35px',
                height: '35px',
                borderRadius: '6px',
                margin: '0 5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              {[1, 2, 3].map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: '35px',
                    height: '35px',
                    borderRadius: '6px',
                    margin: '0 5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: currentPage === page ? 
                      '1px solid #4361ee' : '1px solid #ddd',
                    backgroundColor: currentPage === page ? 
                      '#4361ee' : 'white',
                    color: currentPage === page ? 
                      'white' : 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  {page}
                </button>
              ))}
              <button style={{
                width: '35px',
                height: '35px',
                borderRadius: '6px',
                margin: '0 5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}>
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;