import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Table, Container, Alert, Button, Form, Dropdown, InputGroup, FormControl, Card, Badge, Spinner, Row, Col, Modal } from 'react-bootstrap';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaDownload,
  FaPlusCircle,
  FaTrashAlt,
  FaPhoneAlt,
  FaGlobe,
  FaEdit
} from 'react-icons/fa';
import ReactPaginate from 'react-paginate';

// Constants
const ITEMS_PER_PAGE = 5;

const App = () => {
  const [dids, setDids] = useState([]);
  const [filteredDids, setFilteredDids] = useState([]);
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [user, setUser] = useState([]);
  const [sip, setSip] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [didsList, setDidsList] = useState([]);
  const apiUrl = 'http://localhost:5000/api/admin/DIDDestination/affiche';

  const [newDidData, setNewDidData] = useState({
    did: '',
    username: '',
    status: 'Active',
    priority: 1,
    destinationType: 1,
    sipUser: '',
  });

  const [isAdding, setIsAdding] = useState(false);

  const [editingDid, setEditingDid] = useState(null);

  const fetchSipUser = () => {
    axios.get("http://localhost:5000/api/admin/SIPUsers/nom")
      .then((response) => {
        setSip(response.data.users);
      })
      .catch((err) => {
        console.error('Error fetching sip user:', err);
      });
  };

  const fetchUser = () => {
    axios.get("http://localhost:5000/api/admin/users/users")
      .then((response) => {
        setUser(response.data.users);
      })
      .catch((err) => {
        console.error('Error fetching user:', err);
      });
  };

  const fetchDIDs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl);
      const result = await response.json();
      if (result.dids) {
        setDids(result.dids);
        setFilteredDids(result.dids);
        setMessage('');
        setErrorMessage('');
      } else {
        setErrorMessage('No DIDs found');
      }
    } catch (error) {
      console.error('Error fetching DIDs:', error);
      setErrorMessage('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDIDsList = () => {
    axios.get("http://localhost:5000/api/admin/DIDDestination/getDIDs")
      .then((response) => {
        setDidsList(response.data.dids);
      })
      .catch((err) => {
        console.error('Error fetching DIDs list:', err);
      });
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (term === '') {
      setFilteredDids(dids);
      setCurrentPage(1);
    } else {
      const filtered = dids.filter(did => 
        did.did.toLowerCase().includes(term) || 
        (did.username && did.username.toLowerCase().includes(term)) ||
        getCallTypeLabel(did.Calltype).toLowerCase().includes(term)
      );
      setFilteredDids(filtered);
      setCurrentPage(1);
    }
  };

  const getCallTypeLabel = (callType) => {
    const callTypeMap = {
      0: 'Call to PSTN',
      1: 'SIP',
      2: 'IVR',
      3: 'CallingCard',
      4: 'Direct Extension',
      5: 'Cid Callback',
      6: '0800 Callback',
      7: 'Queue',
      8: 'Sip Group',
      9: 'Custom',
      10: 'Context',
      11: 'Multiples IPs',
    };
    return callTypeMap[callType] || 'Unknown';
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const handleCSVExport = () => {
    setIsExporting(true);
    try {
      const headers = ['DID', 'Username', 'Call Type', 'Time Used', 'Priority', 'Creation Date'];
      const csvRows = [
        headers.join(','),
        ...dids.map((did) => [
          did.did,
          did.username || 'N/A',
          getCallTypeLabel(did.Calltype),
          formatTime(did.TimeUsed),
          did.Priority,
          new Date(did.CreationDate).toLocaleString(),
        ].join(',')),
      ];
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'did_destinations.csv';
      a.click();
      URL.revokeObjectURL(url);
      
      setSuccessMessage('CSV exported successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setErrorMessage('Failed to export CSV');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = (didNumber) => {
    if (!didNumber) {
      setErrorMessage('Erreur: Numéro DID manquant');
      return;
    }
    
    if (window.confirm(`Supprimer le DID ${didNumber} ?`)) {
      axios.delete(`http://localhost:5000/api/admin/DIDDestination/deleteByDid/${didNumber}`)
        .then(() => {
          setSuccessMessage(`DID ${didNumber} supprimé`);
          fetchDIDs();
        })
        .catch(err => {
          setErrorMessage(`Erreur: ${err.response?.data?.message || 'Échec de la suppression'}`);
        });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'sipUser') {
      setNewDidData({
        ...newDidData,
        destination: value,
        [name]: value
      });
    } else {
      setNewDidData({
        ...newDidData,
        [name]: value
      });
    }
  };
  
  const handleAddUser = () => {
    const formattedData = {
      did: newDidData.did,
      username: newDidData.username,
      priority: newDidData.priority,
      destinationType: newDidData.destinationType,
      destination: newDidData.destination,
    };

    console.log('Formatted data being sent to API:', formattedData);

    setIsAdding(true);
    axios
      .post(
        'http://localhost:5000/api/admin/DIDDestination/add',
        formattedData
      )
      .then((response) => {
        setSuccessMessage('DID destination added successfully!');
        setErrorMessage('');
        setIsAdding(false);
        setNewDidData({
          did: '',
          username: '',
          status: 'Active',
          priority: 1,
          destinationType: 1,
          sipUser: '',
        });
        fetchDIDs();
      })
      .catch((err) => {
        console.error('Error adding DID:', err);
        setErrorMessage('Error adding DID: ' + err.message);
        setSuccessMessage('');
        setIsAdding(false);
      });
  };

  const handleUpdate = async () => {
    try {
      // Prepare data matching backend expectations
      const updateData = {
        did: editingDid.did,
        username: editingDid.username || editingDid.sipUser || '',
        destinationType: editingDid.destinationType || 1,
        priority: editingDid.priority || 1,
        destination: editingDid.destination || ''
      };
      
      console.log('Sending update data:', updateData);
      
      const response = await axios.put(
        'http://localhost:5000/api/admin/DIDDestination/update', 
        updateData
      );
      setSuccessMessage(response.data.message);
      fetchDIDs();
      setEditingDid(null);
    } catch (err) {
      console.error('Update error:', err.response?.data);
      setErrorMessage(err.response?.data?.error || 'Erreur lors de la modification');
    }
  };

  const handleEditClick = (did) => {
    setEditingDid({
      did: did.did,
      username: did.username || '',
      destinationType: did.Calltype || 1,
      priority: did.Priority || 1,
      destination: did.destination || '',
      status: did.status || 'Active',
      sipUser: did.sipUser || ''
    });
  };

  const pageCount = Math.ceil(filteredDids.length / ITEMS_PER_PAGE);
  const offset = currentPage * ITEMS_PER_PAGE;
  const currentDIDs = filteredDids.slice(offset, offset + ITEMS_PER_PAGE);
    
  const handlePageChange = (selectedItem) => {
    setCurrentPage(selectedItem.selected);
  };

  useEffect(() => {
    fetchDIDs();
    fetchUser();
    fetchSipUser();
    fetchDIDsList();
  }, []);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .floating-icon {
        position: absolute;
        animation: float 10s infinite ease-in-out;
      }
      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        25% { transform: translateY(-10px) rotate(5deg); }
        50% { transform: translateY(5px) rotate(-5deg); }
        75% { transform: translateY(-5px) rotate(2deg); }
      }
      .btn-hover-effect {
        transition: all 0.2s ease;
        overflow: hidden;
      }
      .btn-hover-effect:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      .pulse-effect {
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(13, 110, 253, 0); }
        100% { box-shadow: 0 0 0 0 rgba(13, 110, 253, 0); }
      }
      .elegant-table th, .elegant-table td {
        border-top: none;
        border-bottom: 1px solid #e9ecef;
      }
      .action-btn .btn-icon {
        transition: transform 0.2s ease;
      }
      .action-btn:hover .btn-icon {
        transform: scale(1.2);
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .main-card {
        animation: fadeIn 0.5s ease-in-out;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const DIDHeader = ({ onCSVExport, isExporting }) => {
    return (
      <Card.Header className="d-flex flex-wrap align-items-center p-0 rounded-top overflow-hidden">
        <div className="bg-primary p-3 w-100 position-relative">
          <div className="position-absolute top-0 end-0 p-2 d-none d-md-block">
            {Array(5).fill().map((_, i) => (
              <div
                key={i}
                className="floating-icon position-absolute"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                <FaPhoneAlt
                  className="text-white opacity-25"
                  style={{
                    fontSize: `${Math.random() * 1.5 + 0.5}rem`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="d-flex align-items-center position-relative z-2">
            <div className="bg-white rounded-circle p-3 me-3 shadow pulse-effect">
              <FaGlobe className="text-primary fs-3" />
            </div>
            <div>
              <h2 className="fw-bold mb-0 text-white">DID Destinations</h2>
              <p className="text-white-50 mb-0 d-none d-md-block">Manage your DID routing and destinations</p>
            </div>
          </div>
        </div>
        <div className="w-100 bg-white p-2 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <Badge bg="primary" className="d-flex align-items-center p-2 ps-3 rounded-pill">
              <span className="me-2 fw-normal">
                Total: <span className="fw-bold">{filteredDids.length}</span>
              </span>
              <span
                className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "24px", height: "24px" }}
              >
                <FaPhoneAlt size={12} />
              </span>
            </Badge>
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="primary" 
              className="d-flex align-items-center gap-2 fw-semibold btn-hover-effect"
              onClick={() => setIsAdding(!isAdding)}
            >
              <div className="icon-container">
                <FaPlusCircle />
              </div>
              <span>Add Destination</span>
            </Button>
            <Button 
              variant="outline-primary" 
              onClick={onCSVExport}
              disabled={isExporting}
              className="d-flex align-items-center gap-2 fw-semibold"
            >
              <div className="icon-container">
                {isExporting ? <Spinner size="sm" /> : <FaDownload />}
              </div>
              <span>Export</span>
            </Button>
          </div>
        </div>
      </Card.Header>
    );
  };

  const SearchBar = ({ searchTerm, onSearchChange }) => {
    return (
      <div className="search-container shadow-sm rounded overflow-hidden">
        <InputGroup>
          <FormControl
            placeholder="Search by DID, Username or Call Type"
            value={searchTerm}
            onChange={onSearchChange}
            className="border-0 py-2"
          />
          <InputGroup.Text className="bg-white border-0">
            <FaSearch className="text-muted" />
            </InputGroup.Text>
        </InputGroup>
      </div>
    );
  };

  const StatusBadge = ({ status }) => {
    return status === "Active" ? (
      <Badge bg="success" className="px-3 py-2 rounded-pill d-flex align-items-center gap-1">
        <FaCheckCircle size={10} />
        <span>Active</span>
      </Badge>
    ) : (
      <Badge bg="secondary" className="px-3 py-2 rounded-pill d-flex align-items-center gap-1">
        <FaTimesCircle size={10} />
        <span>Inactive</span>
      </Badge>
    );
  };

  const DIDTable = ({ dids, onDelete, getCallTypeLabel, formatTime }) => {
    return (
      <Table hover className="elegant-table mb-0 border-0">
        <thead className="bg-light">
          <tr>
            <th className="py-3">DID</th>
            <th className="py-3">Username</th>
            <th className="py-3">Call Type</th>
            <th className="py-3">Time Used</th>
            <th className="py-3">Priority</th>
            <th className="py-3">Creation Date</th>
            <th className="py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {dids.length === 0 ? (
            <tr>
              <td colSpan="7" className="text-center py-5">
                <div className="d-flex flex-column align-items-center gap-3">
                  <FaPhoneAlt size={30} className="text-muted" />
                  <p className="mb-0 text-muted">No DID destinations found</p>
                </div>
              </td>
            </tr>
          ) : (
            dids.map((did) => (
              <tr key={did.id} className="align-middle">
                <td className="fw-medium">{did.did}</td>
                <td>{did.username || 'N/A'}</td>
                <td>
                  <Badge bg="info" className="text-dark bg-opacity-25 px-3 py-2 rounded-pill">
                    {getCallTypeLabel(did.Calltype)}
                  </Badge>
                </td>
                <td>{formatTime(did.TimeUsed)}</td>
                <td>
                  <Badge bg="primary" className="px-2 py-1 rounded-pill">
                    {did.Priority}
                  </Badge>
                </td>
                <td>{new Date(did.CreationDate).toLocaleString()}</td>
                <td className="text-center">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => handleEditClick(did)}
                    className="me-2"
                    title="Modifier"
                  >
                    <FaEdit />
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleDelete(did.did)}
                    title="Supprimer"
                  >
                    <FaTrashAlt />
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    );
  };

  const PaginationComponent = ({ pageCount, currentPage, onPageChange }) => {
    return (
      <ReactPaginate
        previousLabel={"«"}
        nextLabel={"»"}
        breakLabel={"..."}
        pageCount={pageCount}
        marginPagesDisplayed={2}
        pageRangeDisplayed={3}
        onPageChange={onPageChange}
        containerClassName={"pagination justify-content-center mb-0"}
        pageClassName={"page-item"}
        pageLinkClassName={"page-link"}
        previousClassName={"page-item"}
        previousLinkClassName={"page-link"}
        nextClassName={"page-item"}
        nextLinkClassName={"page-link"}
        breakClassName={"page-item"}
        breakLinkClassName={"page-link"}
        activeClassName={"active"}
      />
    );
  };

  return (
    <div style={{ marginLeft: "0px" }}>
      <Container fluid className="px-4 py-4">
        <Row className="justify-content-center">
          <Col xs={12} lg={11}>
            <Card className="shadow border-0 overflow-hidden main-card">
              <DIDHeader 
                onCSVExport={handleCSVExport} 
                isExporting={isExporting}
              />
              <Card.Body className="p-4" style={{ animation: "fadeIn 0.5s ease-in-out" }}>
                {errorMessage && (
                  <Alert variant="danger" className="d-flex align-items-center mb-4 shadow-sm">
                    <FaTimesCircle className="me-2" />
                    {errorMessage}
                  </Alert>
                )}
                {successMessage && (
                  <Alert variant="success" className="d-flex align-items-center mb-4 shadow-sm">
                    <FaCheckCircle className="me-2" />
                    {successMessage}
                  </Alert>
                )}
                {message && (
                  <Alert variant="info" className="d-flex align-items-center mb-4 shadow-sm">
                    <FaCheckCircle className="me-2" />
                    {message}
                  </Alert>
                )}

                <Row className="mb-4">
                  <Col md={6} lg={4}>
                    <SearchBar searchTerm={searchTerm} onSearchChange={handleSearch} />
                  </Col>
                </Row>

                {isAdding && (
                  <Card className="mb-4 shadow-sm">
                    <Card.Body>
                      <Form>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3" controlId="formDID">
                              <Form.Label>DID</Form.Label>
                              <Form.Control
                                as="select"
                                name="did"
                                value={newDidData.did}
                                onChange={handleInputChange}
                                className="shadow-sm"
                                required
                              >
                                <option value="">Select DID</option>
                                {didsList.map((did) => (
                                  <option key={did.did} value={did.did}>
                                    {did.did}
                                  </option>
                                ))}
                              </Form.Control>
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formUsername">
                              <Form.Label>Username</Form.Label>
                              <Form.Control
                                as="select"
                                name="username"
                                value={newDidData.username}
                                onChange={handleInputChange}
                                className="shadow-sm"
                              >
                                <option value="">Select Username</option>
                                {user.map((user) => (
                                  <option key={user.id} value={user.username}>
                                    {user.username}
                                  </option>
                                ))}
                              </Form.Control>
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formCallType">
                              <Form.Label>Call Type</Form.Label>
                              <Form.Control
                                as="select"
                                name="destinationType"
                                value={newDidData.destinationType}
                                onChange={handleInputChange}
                                className="shadow-sm"
                              >
                                <option value="1">SIP</option>
                                <option value="0">Call to PSTN</option>
                                <option value="2">IVR</option>
                                <option value="3">Calling Card</option>
                                <option value="4">Direct Extension</option>
                                <option value="5">Cid Callback</option>
                                <option value="6">0800 Callback</option>
                                <option value="7">Queue</option>
                                <option value="8">Sip Group</option>
                                <option value="9">Custom</option>
                                <option value="10">Context</option>
                                <option value="11">Multiples IPs</option>
                              </Form.Control>
                            </Form.Group>
                          </Col>
                          
                          <Col md={6}>
                            <Form.Group className="mb-3" controlId="formStatus">
                              <Form.Label>Status</Form.Label>
                              <Form.Control
                                as="select"
                                name="status"
                                value={newDidData.status}
                                onChange={handleInputChange}
                                className="shadow-sm"
                              >
                                <option>Active</option>
                                <option>Inactive</option>
                              </Form.Control>
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formPriority">
                              <Form.Label>Priority</Form.Label>
                              <Form.Control
                                type="number"
                                name="priority"
                                value={newDidData.priority}
                                onChange={handleInputChange}
                                min="1"
                                max="5"
                                className="shadow-sm"
                              />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formSipUser">
                              <Form.Label>SIP User</Form.Label>
                              <Form.Control
                                as="select"
                                name="sipUser"
                                value={newDidData.sipUser}
                                onChange={handleInputChange}
                                className="shadow-sm"
                              >
                                <option value="">Select SIP User</option>
                                {sip.map((sipUser) => (
                                  <option key={sipUser.id} value={sipUser.id}>
                                    {sipUser.name}
                                  </option>
                                ))}
                              </Form.Control>
                            </Form.Group>
                          </Col>
                        </Row>
                        
                        <div className="d-flex justify-content-end gap-2">
                          <Button variant="secondary" onClick={() => setIsAdding(false)}>
                            Cancel
                          </Button>
                          <Button variant="primary" onClick={handleAddUser}>
                            Add Destination
                          </Button>
                        </div>
                      </Form>
                    </Card.Body>
                  </Card>
                )}

                {editingDid && (
                  <Modal show={true} onHide={() => setEditingDid(null)} size="lg">
                    <Modal.Header closeButton>
                      <Modal.Title>Modifier DID {editingDid.did}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <Card className="shadow-sm">
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>DID</Form.Label>
                                <Form.Control 
                                  value={editingDid.did} 
                                  disabled
                                />
                              </Form.Group>
                              
                              <Form.Group className="mb-3">
                                <Form.Label>Username</Form.Label>
                                <Form.Control
                                  as="select"
                                  value={editingDid.username}
                                  onChange={(e) => setEditingDid({...editingDid, username: e.target.value})}
                                >
                                  <option value="">Select Username</option>
                                  {user.map((u) => (
                                    <option key={u.id} value={u.username}>
                                      {u.username}
                                    </option>
                                  ))}
                                </Form.Control>
                              </Form.Group>
                              
                              <Form.Group className="mb-3" controlId="formCallType">
                              <Form.Label>Call Type</Form.Label>
                              <Form.Control
                                as="select"
                                value={editingDid.destinationType}
                                onChange={(e) => setEditingDid({...editingDid, destinationType: parseInt(e.target.value)})}
                                className="shadow-sm"
                              >
                                <option value="1">SIP</option>
                                <option value="0">Call to PSTN</option>
                                <option value="2">IVR</option>
                                <option value="3">Calling Card</option>
                                <option value="4">Direct Extension</option>
                                <option value="5">Cid Callback</option>
                                <option value="6">0800 Callback</option>
                                <option value="7">Queue</option>
                                <option value="8">Sip Group</option>
                                <option value="9">Custom</option>
                                <option value="10">Context</option>
                                <option value="11">Multiples IPs</option>
                              </Form.Control>
                            </Form.Group>
                            </Col>
                            
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Priorité</Form.Label>
                                <Form.Control
                                  type="number"
                                  min="1"
                                  max="5"
                                  value={editingDid.priority}
                                  onChange={(e) => setEditingDid({...editingDid, priority: e.target.value})}
                                />
                              </Form.Group>
                              
                              <Form.Group className="mb-3" controlId="formSipUser">
                              <Form.Label>SIP User</Form.Label>
                              <Form.Control
                                as="select"
                                name="sipUser"
                                value={newDidData.sipUser}
                                onChange={handleInputChange}
                                className="shadow-sm"
                              >
                                <option value="">Select SIP User</option>
                                {sip.map((sipUser) => (
                                  <option key={sipUser.id} value={sipUser.id}>
                                    {sipUser.name}
                                  </option>
                                ))}
                              </Form.Control>
                            </Form.Group>
                              

                              <Form.Group className="mb-3">
                                <Form.Label>Statut</Form.Label>
                                <Form.Control
                                  as="select"
                                  value={editingDid.status}
                                  onChange={(e) => setEditingDid({...editingDid, status: e.target.value})}
                                >
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                                </Form.Control>
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                        <Card.Footer className="d-flex justify-content-end gap-2">
                          <Button variant="secondary" onClick={() => setEditingDid(null)}>
                            Annuler
                          </Button>
                          <Button variant="primary" onClick={handleUpdate}>
                            Enregistrer
                          </Button>
                        </Card.Footer>
                      </Card>
                    </Modal.Body>
                  </Modal>
                )}

                <div className="table-responsive shadow-sm rounded overflow-hidden">
                  <DIDTable 
                    dids={currentDIDs} 
                    onDelete={handleDelete} 
                    getCallTypeLabel={getCallTypeLabel} 
                    formatTime={formatTime} 
                  />
                </div>

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-4">
                  <div className="text-muted small">
                    {!isLoading && (
                      <>
                        <Badge bg="light" text="dark" className="me-2 shadow-sm">
                          <span className="fw-semibold">{currentDIDs.length}</span> of {filteredDids.length} DIDs
                        </Badge>
                        {searchTerm && (
                          <Badge bg="light" text="dark" className="shadow-sm">
                            Filtered from {dids.length} total
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  <PaginationComponent
                    pageCount={pageCount}
                    onPageChange={handlePageChange}
                    currentPage={currentPage}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default App;