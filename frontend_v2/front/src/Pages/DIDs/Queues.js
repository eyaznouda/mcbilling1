"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Table, Button, Modal, Form, Dropdown, Alert, Card, Container, Row, Col, Badge, Spinner } from "react-bootstrap"
import ReactPaginate from "react-paginate"
import { CSVLink } from "react-csv"
import {
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaSearch,
  FaDownload,
  FaPlusCircle,
  FaTrashAlt,
  FaPhoneAlt,
  FaHeadset,
  FaCog,
  FaUsers,
  FaUserClock
} from "react-icons/fa"

// Constants
const ITEMS_PER_PAGE = 10;

function Queues() {
  const [queues, setQueues] = useState([]);
  const [filteredQueues, setFilteredQueues] = useState([]);
  const [usernames, setUsernames] = useState([]);
  const [queueForm, setQueueForm] = useState({
    username: '',
    language: 'English',
    strategy: 'Ringal',
    talk_time: 0,
    total_calls: 0,
    answered: 0
  });
  const [newQueue, setNewQueue] = useState({
    id_user: '',
    name: '',
    language: 'En',
    strategy: 'Ringall',
    ringinuse: 0,
    time: 1,
    timecall: 1,
    weight: '',
    Frequency: '',
    announce: 'Yes',
    announce_holdtime: 'Yes',
    announceFrequency: 'Yes',
    join: 'Yes',
    leavewhenempty: 'Yes',
    max_wait_time: 0,
    maxwait: '',
    ring_or_moh: 'moh'
  });
  const [showModal, setShowModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [queueToDelete, setQueueToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  const itemsPerPage = 10;

  const showAlert = (message, variant = 'success') => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ ...alert, show: false }), 5000);
  };

  const fetchQueues = (sortBy = 'name') => {
    axios.get(`http://localhost:5000/api/admin/Queues/afficher?sortBy=${sortBy}`)
      .then((response) => {
        setQueues(response.data.queues);
        setFilteredQueues(response.data.queues);
      })
      .catch((error) => console.error('Error fetching queues:', error));
  };

  const fetchUsernames = () => {
    axios.get('http://localhost:5000/api/admin/users/users') 
      .then((response) => {
        setUsernames(response.data.users);
      })
      .catch((error) => console.error('Error fetching usernames:', error));
  };

  useEffect(() => {
    fetchQueues();
    fetchUsernames();
  }, []);

  useEffect(() => {
    const filtered = queues.filter(queue =>
      queue.username && queue.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredQueues(filtered);
    setCurrentPage(1);
  }, [searchTerm, queues]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQueues.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQueues.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const addQueue = (queue) => {
    console.log('Sending queue data:', queue);
    axios.post('http://localhost:5000/api/admin/Queues/ajouter', queue)
      .then((response) => {
        setQueues([...queues, response.data]);
        fetchQueues(); // Refresh the queue list
        showAlert('Queue added successfully!');
        setShowModal(false);
      })
      .catch((error) => {
        console.error('Full error adding queue:', error);
        console.error('Error response data:', error.response?.data);
        showAlert('Failed to add queue', 'danger');
      });
  };

  const updateQueue = (queueId, updatedQueue) => {
    console.log('Updating queue with ID:', queueId);
    
    // Prepare data for the backend, ensuring required fields are included
    const updateData = {
      id_user: updatedQueue.id_user,
      language: updatedQueue.language,
      strategy: updatedQueue.strategy,
      // Ensure these required fields are never null
      talk_time: updatedQueue.talk_time || 0,
      total_calls: updatedQueue.total_calls || 0,
      answered: updatedQueue.answered || 0,
      // Include other fields as needed
      name: updatedQueue.name,
      // Include username for user association
      username: updatedQueue.username,
      // Include all other relevant fields
      ringinuse: updatedQueue.ringinuse,
      time: updatedQueue.time,
      timecall: updatedQueue.timecall,
      weight: updatedQueue.weight,
      Frequency: updatedQueue.Frequency,
      announce: updatedQueue.announce,
      announce_holdtime: updatedQueue.announce_holdtime,
      announceFrequency: updatedQueue.announceFrequency,
      join: updatedQueue.join,
      leavewhenempty: updatedQueue.leavewhenempty,
      max_wait_time: updatedQueue.max_wait_time,
      maxwait: updatedQueue.maxwait,
      ring_or_moh: updatedQueue.ring_or_moh
    };
    
    console.log('Update data being sent:', updateData);
    
    axios.put(`http://localhost:5000/api/admin/Queues/modifier/${queueId}`, updateData)
      .then((response) => {
        console.log('Update response:', response.data);
        fetchQueues();
        setShowUpdateModal(false);
        showAlert('Queue updated successfully!');
      })
      .catch((error) => {
        console.error('Error updating queue:', error);
        console.error('Error details:', error.response?.data);
        showAlert(`Failed to update queue: ${error.response?.data?.error || error.message}`, 'danger');
      });
  };

  const deleteQueue = (queueId) => {
    console.log('Attempting to delete queue with ID:', queueId);
    
    if (!queueId) {
      console.error('Cannot delete queue: No queue ID provided');
      showAlert('Cannot delete queue: Missing queue ID', 'danger');
      return;
    }
    
    axios.delete(`http://localhost:5000/api/admin/Queues/supprimer/${queueId}`)
      .then((response) => {
        console.log('Delete response:', response.data);
        setQueues(queues.filter((queue) => queue.id !== queueId));
        setShowDeleteModal(false);
        showAlert('Queue deleted successfully!');
      })
      .catch((error) => {
        console.error('Error deleting queue:', error);
        console.error('Error details:', error.response?.data);
        showAlert(`Failed to delete queue: ${error.response?.data?.message || error.message}`, 'danger');
      });
  };

  const handleEdit = (queue) => {
    console.log('Original queue data for editing:', queue);
    setNewQueue({
      // Store the queue ID for the update operation
      id: queue.id,
      id_user: queue.id_user,
      name: queue.name,
      username: queue.username, // Assurez-vous d'inclure le username
      language: queue.language,
      strategy: queue.strategy,
      ringinuse: queue.ringinuse,
      time: queue.time,
      timecall: queue.timecall,
      weight: queue.weight,
      Frequency: queue.Frequency,
      announce: queue.announce,
      announce_holdtime: queue.announce_holdtime,
      announceFrequency: queue.announceFrequency,
      join: queue.join,
      leavewhenempty: queue.leavewhenempty,
      max_wait_time: queue.max_wait_time,
      maxwait: queue.maxwait,
      ring_or_moh: queue.ring_or_moh,
      // Add the required fields for the update operation with default values if not present
      talk_time: queue.talk_time || 0,
      total_calls: queue.total_calls || 0,
      answered: queue.answered || 0
    });
    console.log('Queue to edit:', queue);
    setShowUpdateModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQueueForm({ ...queueForm, [name]: value });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewQueue({ ...newQueue, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addQueue(newQueue);
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    // Make sure we're sending the queue ID for the update
    // newQueue should already have the id property from handleEdit
    updateQueue(newQueue.id, newQueue);
  };

  const handleShow = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  // Header Component
  function QueuesHeader({ onAddClick, queues, isExporting = false }) {
    const csvData = [
      ["Queue Name", "Username", "Language", "Strategy", "Wait Time", "Ring In Use"],
      ...queues.map((queue) => [
        queue.name || "",
        queue.username || "",
        queue.language || "",
        queue.strategy || "",
        queue.max_wait_time || "0",
        queue.ringinuse === 1 ? "Yes" : "No",
      ]),
    ]

    return (
      <Card.Header className="d-flex flex-wrap align-items-center p-0 rounded-top overflow-hidden">
        <div className="bg-primary p-3 w-100 position-relative">
          <div className="position-absolute top-0 end-0 p-2 d-none d-md-block">
            {Array(5)
              .fill()
              .map((_, i) => (
                <div
                  key={i}
                  className="floating-icon position-absolute"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.5}s`,
                  }}
                >
                  <FaHeadset
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
              <FaUsers className="text-primary fs-3" />
            </div>
            <div>
              <h2 className="fw-bold mb-0 text-white">Manage Queues</h2>
              <p className="text-white-50 mb-0 d-none d-md-block">Configure and manage your call queues</p>
            </div>
          </div>
        </div>
        <div className="w-100 bg-white p-2 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <Badge bg="primary" className="d-flex align-items-center p-2 ps-3 rounded-pill">
              <span className="me-2 fw-normal">
                Total: <span className="fw-bold">{queues.length}</span>
              </span>
              <span
                className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "24px", height: "24px" }}
              >
                <FaHeadset size={12} />
              </span>
            </Badge>
            <Dropdown>
              <Dropdown.Toggle variant="light" id="dropdown-sort" className="shadow-sm border">
                <FaCog className="me-2" size={14} /> Sort By
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => fetchQueues('name')}>Queue Name</Dropdown.Item>
                <Dropdown.Item onClick={() => fetchQueues('id_user')}>Username</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={onAddClick}
              className="d-flex align-items-center gap-2 fw-semibold btn-hover-effect"
            >
              <div className="icon-container">
                <FaPlusCircle />
              </div>
              <span>Add Queue</span>
            </Button>
            <CSVLink
              data={csvData}
              filename={"queues.csv"}
              className="btn btn-success d-flex align-items-center gap-2 fw-semibold btn-hover-effect"
              disabled={isExporting}
            >
              <div className="icon-container">
                {isExporting ? <Spinner animation="border" size="sm" /> : <FaDownload />}
              </div>
              <span>Export</span>
            </CSVLink>
          </div>
        </div>
      </Card.Header>
    )
  }

  // Search Bar Component
  function SearchBar({ searchTerm, onSearchChange }) {
    return (
      <div className="position-relative">
        <div className="position-absolute top-50 start-0 translate-middle-y ps-3">
          <FaSearch className="text-muted" size={14} />
        </div>
        <Form.Control
          type="text"
          placeholder="Search by username..."
          value={searchTerm}
          onChange={onSearchChange}
          className="ps-5 py-2 border-0 shadow-sm rounded"
        />
      </div>
    )
  }

  // Status Badge Component
  function StatusBadge({ status }) {
    return status ? (
      <Badge bg="success" className="d-flex align-items-center gap-1 px-2 py-1">
        <FaCheckCircle size={10} />
        <span>Active</span>
      </Badge>
    ) : (
      <Badge bg="secondary" className="d-flex align-items-center gap-1 px-2 py-1">
        <FaTimesCircle size={10} />
        <span>Inactive</span>
      </Badge>
    )
  }

  // Action Buttons Component
  function ActionButtons({ onEdit, onDelete }) {
    return (
      <div className="d-flex gap-2 action-btn">
        <Button variant="outline-primary" size="sm" onClick={onEdit} className="d-flex align-items-center gap-1 p-1 px-2">
          <FaEdit className="btn-icon" />
          <span className="d-none d-md-inline">Edit</span>
        </Button>
        <Button variant="outline-danger" size="sm" onClick={onDelete} className="d-flex align-items-center gap-1 p-1 px-2">
          <FaTrashAlt className="btn-icon" />
          <span className="d-none d-md-inline">Delete</span>
        </Button>
      </div>
    )
  }

  // Empty State Component
  function EmptyState() {
    return (
      <div className="text-center py-5">
        <div className="mb-3">
          <FaHeadset size={48} className="text-muted" />
        </div>
        <h5>No Queues Found</h5>
        <p className="text-muted">Add a new queue to get started or try a different search term.</p>
      </div>
    )
  }

  // Pagination Component
  function PaginationSection({ pageCount, onPageChange, currentPage }) {
    return (
      <ReactPaginate
        previousLabel={"«"}
        nextLabel={"»"}
        breakLabel={"..."}
        pageCount={pageCount}
        marginPagesDisplayed={2}
        pageRangeDisplayed={3}
        onPageChange={onPageChange}
        containerClassName={"pagination mb-0"}
        pageClassName={"page-item"}
        pageLinkClassName={"page-link"}
        previousClassName={"page-item"}
        previousLinkClassName={"page-link"}
        nextClassName={"page-item"}
        nextLinkClassName={"page-link"}
        breakClassName={"page-item"}
        breakLinkClassName={"page-link"}
        activeClassName={"active"}
        forcePage={currentPage}
      />
    )
  }

  // Queues Table Component
  function QueuesTable({ queues, onEdit, onDelete, isLoading = false }) {
    if (isLoading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading queues...</p>
        </div>
      )
    }

    if (queues.length === 0) {
      return <EmptyState />
    }

    return (
      <div className="table-responsive">
        <Table hover className="align-middle mb-0 elegant-table">
          <thead className="bg-light">
            <tr>
              <th className="fw-semibold">Queue Name</th>
              <th className="fw-semibold">Username</th>
              <th className="fw-semibold">Language</th>
              <th className="fw-semibold">Strategy</th>
              <th className="fw-semibold">Talk Time</th>
              <th className="fw-semibold">Total Calls</th>
              <th className="fw-semibold">Answered</th>
              <th className="fw-semibold text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {queues.map((queue) => (
              <tr key={queue.id || queue.id_user}>
                <td className="fw-medium">{queue.name}</td>
                <td>{queue.username}</td>
                <td>{queue.language}</td>
                <td>{queue.strategy}</td>
                <td>{queue.talk_time}</td>
                <td>{queue.total_calls}</td>
                <td>{queue.answered}</td>
                <td className="text-end">
                  <ActionButtons
                    onEdit={() => onEdit(queue)}
                    onDelete={() => onDelete(queue)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }

  // Main component return
  return (
    <div style={{ marginLeft: "80px" }}>
      <style jsx="true">{`
        .btn-hover-effect {
          transition: transform 0.2s ease;
        }
        .btn-hover-effect:hover {
          transform: translateY(-2px);
        }
        .icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .floating-icon {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
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
      `}</style>

      <Container fluid className="px-4 py-4">
        <Row className="justify-content-center">
          <Col xs={12} lg={11}>
            <Card className="shadow border-0 overflow-hidden main-card">
              <QueuesHeader 
                onAddClick={handleShow} 
                queues={queues} 
              />
              <Card.Body className="p-4" style={{ animation: "fadeIn 0.5s ease-in-out" }}>
                {alert.show && (
                  <Alert variant={alert.variant} onClose={() => setAlert({...alert, show: false})} dismissible className="d-flex align-items-center mb-4 shadow-sm">
                    {alert.variant === 'success' ? <FaCheckCircle className="me-2" /> : <FaTimesCircle className="me-2" />}
                    {alert.message}
                  </Alert>
                )}

                <Row className="mb-4">
                  <Col md={6} lg={4}>
                    <SearchBar searchTerm={searchTerm} onSearchChange={(e) => setSearchTerm(e.target.value)} />
                  </Col>
                </Row>

                <QueuesTable
                  queues={currentItems}
                  onEdit={handleEdit}
                  onDelete={(queue) => {
                    // Use the queue's id instead of id_user for deletion
                    setQueueToDelete(queue.id);
                    setShowDeleteModal(true);
                  }}
                />

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-4">
                  <div className="text-muted small">
                    <Badge bg="light" text="dark" className="me-2 shadow-sm">
                      <span className="fw-semibold">{currentItems.length}</span> of {filteredQueues.length} Queues
                    </Badge>
                    {searchTerm && (
                      <Badge bg="light" text="dark" className="shadow-sm">
                        Filtered from {queues.length} total
                      </Badge>
                    )}
                  </div>
                  <PaginationSection
                    pageCount={totalPages}
                    onPageChange={({ selected }) => setCurrentPage(selected + 1)}
                    currentPage={currentPage - 1}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal show={showModal} onHide={handleClose} size="lg" centered className="queue-modal">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaHeadset className="me-2" />
            Add New Queue
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleSubmit} className="queue-form">
            <Form.Group controlId="formQueueName" className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                as="select"
                name="id_user"
                value={newQueue.id_user}
                onChange={handleChange}
                required
              >
                <option value="">Select Username</option>
                {usernames.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formUserId" className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newQueue.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group controlId="formLanguage" className="mb-3">
              <Form.Label>Language</Form.Label>
              <Form.Control
                as="select"
                name="language"
                value={newQueue.language}
                onChange={handleChange}
              >
                <option value="En">English</option>
                <option value="Fr">French</option>
                <option value="Sp">Spanish</option>
                <option value="Rus">Russian</option>
                <option value="Port">Portuguese</option>
                <option value="It">Italian</option>
                <option value="Ger">German</option>
                <option value="Ch">Chinese</option>
                <option value="Jap">Japanese</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formStrategy" className="mb-3">
              <Form.Label>Strategy</Form.Label>
              <Form.Control
                as="select"
                name="strategy"
                value={newQueue.strategy}
                onChange={handleChange}
              >
                <option value="Ringall">Ringall - Ring all available channels until one answers</option>
                <option value="LeastRecent">LeastRecent - Round robin with memory</option>
                <option value="FewestCalls">FewestCalls - Ring interface with fewest calls</option>
                <option value="Random">Random - Ring a random interface</option>
                <option value="RoundRobin">RoundRobin - Ring interfaces in order</option>
                <option value="Wrap">Wrap - Rings interfaces in the order they were listed</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formRingTime" className="mb-3">
              <Form.Label>Ring Time</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter Ring Time"
                name="ringinuse"
                value={newQueue.ringinuse}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="formMOH" className="mb-3">
              <Form.Label>Time for another agent</Form.Label>
              <Form.Control
                type="number"
                placeholder="1"
                name="time"
                value={newQueue.time}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="formctimecall" className="mb-3">
              <Form.Label>Time for another call</Form.Label>
              <Form.Control
                type="number"
                placeholder="1"
                name="timecall"
                value={newQueue.timecall}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="formweight" className="mb-3">
              <Form.Label>Weight</Form.Label>
              <Form.Control
                type="text"
                placeholder="Weight"
                name="weight"
                value={newQueue.weight}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="formFrequency" className="mb-3">
              <Form.Label>Frequency</Form.Label>
              <Form.Control
                type="text"
                placeholder="Frequency"
                name="Frequency"
                value={newQueue.Frequency}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="formAnnounce" className="mb-3">
              <Form.Label>Announce Position</Form.Label>
              <Form.Control
                as="select"
                name="announce"
                value={newQueue.announce}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formAnnounceHoldtime" className="mb-3">
              <Form.Label>Announce Holdtime</Form.Label>
              <Form.Control
                as="select"
                name="announce_holdtime"
                value={newQueue.announce_holdtime}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formAnnounceFrequency" className="mb-3">
              <Form.Label>Announce Frequency</Form.Label>
              <Form.Control
                as="select"
                name="announceFrequency"
                value={newQueue.announceFrequency}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formJoin" className="mb-3">
              <Form.Label>Join Empty</Form.Label>
              <Form.Control
                as="select"
                name="join"
                value={newQueue.join}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formLeave" className="mb-3">
              <Form.Label>Leave When Empty</Form.Label>
              <Form.Control
                as="select"
                name="leavewhenempty"
                value={newQueue.leavewhenempty}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formMaxWaitTime" className="mb-3">
              <Form.Label>Max Wait Time</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter Max Wait Time"
                name="max_wait_time"
                value={newQueue.max_wait_time}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="formMaxWaitTimeAction" className="mb-3">
              <Form.Label>Max Wait Time Action</Form.Label>
              <Form.Control
                type="text"
                placeholder="Max Wait Time Action"
                name="maxwait"
                value={newQueue.maxwait}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="formRingOrMOH" className="mb-3">
              <Form.Label>Ring or Playing MOH</Form.Label>
              <Form.Control
                as="select"
                name="ring_or_moh"
                value={newQueue.ring_or_moh}
                onChange={handleChange}
              >
                <option value="moh">MOH</option>
                <option value="ring">Ring</option>
              </Form.Control>
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={handleClose} className="me-2">
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Add Queue
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Update Modal - Styled to match DIDs.js */}
      <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} size="lg" centered className="queue-modal">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaEdit className="me-2" />
            Update Queue
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleUpdateSubmit} className="queue-form">
            <Form.Group controlId="formQueueName" className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                as="select"
                name="id_user"
                value={newQueue.id_user}
                onChange={handleChange}
                required
              >
                <option value="">Select Username</option>
                {usernames.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formUserId" className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newQueue.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group controlId="formLanguage" className="mb-3">
              <Form.Label>Language</Form.Label>
              <Form.Control
                as="select"
                name="language"
                value={newQueue.language}
                onChange={handleChange}
              >
                <option value="En">English</option>
                <option value="Fr">French</option>
                <option value="Sp">Spanish</option>
                <option value="Rus">Russian</option>
                <option value="Port">Portuguese</option>
                <option value="It">Italian</option>
                <option value="Ger">German</option>
                <option value="Ch">Chinese</option>
                <option value="Jap">Japanese</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formStrategy" className="mb-3">
              <Form.Label>Strategy</Form.Label>
              <Form.Control
                as="select"
                name="strategy"
                value={newQueue.strategy}
                onChange={handleChange}
              >
                <option value="Ringall">Ringall - Ring all available channels until one answers</option>
                <option value="LeastRecent">LeastRecent - Round robin with memory</option>
                <option value="FewestCalls">FewestCalls - Ring interface with fewest calls</option>
                <option value="Random">Random - Ring a random interface</option>
                <option value="RoundRobin">RoundRobin - Ring interfaces in order</option>
                <option value="Wrap">Wrap - Rings interfaces in the order they were listed</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formRingTime" className="mb-3">
              <Form.Label>Ring Time</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter Ring Time"
                name="ringinuse"
                value={newQueue.ringinuse}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="formMOH" className="mb-3">
              <Form.Label>Time for another agent</Form.Label>
              <Form.Control
                type="number"
                placeholder="1"
                name="time"
                value={newQueue.time}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="formctimecall" className="mb-3">
              <Form.Label>Time for another call</Form.Label>
              <Form.Control
                type="number"
                placeholder="1"
                name="timecall"
                value={newQueue.timecall}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="formweight" className="mb-3">
              <Form.Label>Weight</Form.Label>
              <Form.Control
                type="text"
                placeholder="Weight"
                name="weight"
                value={newQueue.weight}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="formFrequency" className="mb-3">
              <Form.Label>Frequency</Form.Label>
              <Form.Control
                type="text"
                placeholder="Frequency"
                name="Frequency"
                value={newQueue.Frequency}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="formAnnounce" className="mb-3">
              <Form.Label>Announce Position</Form.Label>
              <Form.Control
                as="select"
                name="announce"
                value={newQueue.announce}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formAnnounceHoldtime" className="mb-3">
              <Form.Label>Announce Holdtime</Form.Label>
              <Form.Control
                as="select"
                name="announce_holdtime"
                value={newQueue.announce_holdtime}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formAnnounceFrequency" className="mb-3">
              <Form.Label>Announce Frequency</Form.Label>
              <Form.Control
                as="select"
                name="announceFrequency"
                value={newQueue.announceFrequency}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formJoin" className="mb-3">
              <Form.Label>Join Empty</Form.Label>
              <Form.Control
                as="select"
                name="join"
                value={newQueue.join}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formLeave" className="mb-3">
              <Form.Label>Leave When Empty</Form.Label>
              <Form.Control
                as="select"
                name="leavewhenempty"
                value={newQueue.leavewhenempty}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="formMaxWaitTime" className="mb-3">
              <Form.Label>Max Wait Time</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter Max Wait Time"
                name="max_wait_time"
                value={newQueue.max_wait_time}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="formMaxWaitTimeAction" className="mb-3">
              <Form.Label>Max Wait Time Action</Form.Label>
              <Form.Control
                type="text"
                placeholder="Max Wait Time Action"
                name="maxwait"
                value={newQueue.maxwait}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group controlId="formRingOrMOH" className="mb-3">
              <Form.Label>Ring or Playing MOH</Form.Label>
              <Form.Control
                as="select"
                name="ring_or_moh"
                value={newQueue.ring_or_moh}
                onChange={handleChange}
              >
                <option value="moh">MOH</option>
                <option value="ring">Ring</option>
              </Form.Control>
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={() => setShowUpdateModal(false)} className="me-2">
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Update Queue
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal - Styled to match DIDs.js */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="queue-modal">
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="d-flex align-items-center">
            <FaTrashAlt className="me-2" />
            Confirm Deletion
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Alert variant="danger" className="d-flex align-items-center shadow-sm">
            <FaTimesCircle className="me-2" size={18} />
            <div>
              <strong>Warning!</strong> Are you sure you want to delete this queue? This action cannot be undone.
            </div>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={() => setShowDeleteModal(false)} className="d-flex align-items-center gap-2">
            <span>Cancel</span>
          </Button>
          <Button variant="danger" onClick={() => {
            deleteQueue(queueToDelete);
            setShowDeleteModal(false);
          }} className="d-flex align-items-center gap-2">
            <FaTrashAlt size={14} />
            <span>Delete</span>
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Queues;