import React, { useEffect, useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Table, Form, Modal, Alert, Card, Container, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { CSVLink } from 'react-csv';
import ReactPaginate from 'react-paginate';
import { FaCheckCircle, FaTimesCircle, FaEdit, FaSearch, FaDownload, FaPlusCircle, FaTrashAlt, FaFileAlt } from 'react-icons/fa';

const ITEMS_PER_PAGE = 10;
const API_BASE_URL = 'http://localhost:5000/api';

const DEFAULT_RATE_DATA = {
  id_user: '',
  id_prefix: '',
  destination: '',
  rateinitial: '',
  initblock: '',
  billingblock: ''
};

function UserRatesHeader({ onAddClick, rates, isExporting = false }) {
  const csvData = [
    ['Username', 'Prefix', 'Destination', 'Initial Rate', 'Init Block', 'Billing Block'],
    ...rates.map(rate => [
      rate.username,
      rate.prefix,
      rate.destination,
      rate.rateinitial,
      rate.initblock,
      rate.billingblock
    ])
  ];

  return (
    <Card.Header className="d-flex flex-wrap align-items-center p-0 rounded-top overflow-hidden">
      <div className="bg-primary p-3 w-100 position-relative">
        <div className="d-flex align-items-center position-relative z-2">
          <div className="bg-white rounded-circle p-3 me-3 shadow pulse-effect">
            <FaFileAlt className="text-primary fs-3" />
          </div>
          <div>
            <h2 className="fw-bold mb-0 text-white">User Custom Rates</h2>
            <p className="text-white-50 mb-0 d-none d-md-block">Manage custom rates for users</p>
          </div>
        </div>
      </div>
      <div className="w-100 bg-white p-2 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <Badge bg="primary" className="d-flex align-items-center p-2 ps-3 rounded-pill">
            <span className="me-2 fw-normal">
              Total: <span className="fw-bold">{rates.length}</span>
            </span>
          </Badge>
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
            <span>Add Rate</span>
          </Button>
          <CSVLink
            data={csvData}
            filename="user_rates_export.csv"
            className="btn btn-success d-flex align-items-center gap-2 fw-semibold btn-hover-effect"
          >
            <div className="icon-container">
              <FaDownload />
            </div>
            <span>Export CSV</span>
          </CSVLink>
        </div>
      </div>
    </Card.Header>
  );
}

function SearchBar({ searchTerm, onSearchChange }) {
  return (
    <div className="position-relative">
      <Form.Control
        type="text"
        placeholder="Search by Username, Prefix or Destination"
        value={searchTerm}
        onChange={onSearchChange}
        className="ps-4"
      />
      <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" />
    </div>
  );
}

function ActionButtons({ onEdit, onDelete }) {
  return (
    <div className="d-flex gap-2">
      <Button 
        variant="outline-primary" 
        size="sm" 
        onClick={onEdit}
        className="action-btn"
      >
        <FaEdit className="btn-icon" />
      </Button>
      <Button 
        variant="outline-danger" 
        size="sm" 
        onClick={onDelete}
        className="action-btn"
      >
        <FaTrashAlt className="btn-icon" />
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan="7" className="text-center py-5">
        <div className="d-flex flex-column align-items-center">
          <FaFileAlt className="text-muted mb-2" size={32} />
          <h5 className="text-muted">No rates found</h5>
          <p className="text-muted small">Add your first custom rate to get started</p>
        </div>
      </td>
    </tr>
  );
}

function RatesTableComponent({ rates, onEdit, onDelete, isLoading, prefixes }) {
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <Table striped bordered hover className="mb-0">
      <thead className="table-primary">
        <tr>
          <th>Username</th>
          <th>Prefix</th>
          <th>Destination</th>
          <th>Initial Rate</th>
          <th>Init Block</th>
          <th>Billing Block</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rates.length > 0 ? (
          rates.map((rate) => {
            // Find the prefix from the prefixes array to get the destination
            const prefix = prefixes.find(p => p.id === rate.id_prefix);
            const destination = prefix ? prefix.destination : rate.destination;
            
            return (
              <tr key={rate.id} className="plan-row">
                <td>{rate.username}</td>
                <td>{rate.prefix}</td>
                <td>{destination}</td>
                <td>{rate.rateinitial}</td>
                <td>{rate.initblock}</td>
                <td>{rate.billingblock}</td>
                <td>
                  <ActionButtons 
                    onEdit={() => onEdit(rate)}
                    onDelete={() => onDelete(rate.id)}
                  />
                </td>
              </tr>
            );
          })
        ) : (
          <EmptyState />
        )}
      </tbody>
    </Table>
  );
}

function PaginationSection({ pageCount, onPageChange, currentPage }) {
  return (
    <ReactPaginate
      previousLabel={'Previous'}
      nextLabel={'Next'}
      breakLabel={'...'}
      pageCount={pageCount}
      marginPagesDisplayed={2}
      pageRangeDisplayed={5}
      onPageChange={onPageChange}
      containerClassName={'pagination justify-content-center mb-0'}
      pageClassName={'page-item'}
      pageLinkClassName={'page-link'}
      previousClassName={'page-item'}
      previousLinkClassName={'page-link'}
      nextClassName={'page-item'}
      nextLinkClassName={'page-link'}
      breakClassName={'page-item'}
      breakLinkClassName={'page-link'}
      activeClassName={'active'}
      forcePage={currentPage}
    />
  );
}

function RateModal({
  show,
  onHide,
  title,
  onSubmit,
  modalData,
  onInputChange,
  isSubmitting,
  usernames,
  prefixes
}) {
  const [selectedPrefix, setSelectedPrefix] = useState(modalData.id_prefix || '');
  const [destination, setDestination] = useState('');

  // Function to get destination from prefix
  const getDestinationFromPrefix = (prefixId) => {
    if (!prefixId || !prefixes) return '';
    const prefix = prefixes.find(p => String(p.id) === String(prefixId));
    return prefix ? prefix.destination : '';
  };

  useEffect(() => {
    // Initialize destination when modal opens
    if (modalData.id_prefix && prefixes.length > 0) {
      const dest = getDestinationFromPrefix(modalData.id_prefix);
      setDestination(dest);
    }
  }, [modalData.id_prefix, prefixes]);

  const handlePrefixChange = (e) => {
    const value = e.target.value;
    setSelectedPrefix(value);
    onInputChange(e);
    
    // Update destination immediately when prefix changes
    const dest = getDestinationFromPrefix(value);
    setDestination(dest);
    onInputChange({ target: { name: 'destination', value: dest } });
  };

  // Remove the second useEffect since we're handling destination updates in handlePrefixChange

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={onSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Select 
              name="id_user" 
              value={modalData.id_user || ''}
              onChange={onInputChange}
              required
              disabled={isSubmitting}
            >
              <option value="">Select a user</option>
              {usernames.length === 0 ? (
                <option value="" disabled>Loading users...</option>
              ) : (
                usernames.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))
              )}
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Prefix</Form.Label>
            <Form.Select 
              name="id_prefix" 
              value={selectedPrefix}
              onChange={handlePrefixChange}
              required
              disabled={isSubmitting}
            >
              <option value="">Select a prefix</option>
              {prefixes.length === 0 ? (
                <option value="" disabled>Loading prefixes...</option>
              ) : (
                prefixes.map(prefix => (
                  <option key={prefix.id} value={prefix.id}>
                    {prefix.prefix}
                  </option>
                ))
              )}
            </Form.Select>
          </Form.Group>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="destination">
                <Form.Label>Destination</Form.Label>
                <Form.Control
                  type="text"
                  name="destination"
                  value={destination}
                  readOnly
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="rateinitial">
                <Form.Label>Initial Rate</Form.Label>
                <Form.Control
                  type="number"
                  name="rateinitial"
                  value={modalData.rateinitial}
                  onChange={onInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="initblock">
                <Form.Label>Init Block</Form.Label>
                <Form.Control
                  type="number"
                  name="initblock"
                  value={modalData.initblock}
                  onChange={onInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="billingblock">
                <Form.Label>Billing Block</Form.Label>
                <Form.Control
                  type="number"
                  name="billingblock"
                  value={modalData.billingblock}
                  onChange={onInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="outline-secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                title.includes('Edit') ? 'Update Rate' : 'Add Rate'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

function UserCustomRates() {
  const [userRates, setUserRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(DEFAULT_RATE_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernames, setUsernames] = useState([]);
  const [prefixes, setPrefixes] = useState([]);

  useEffect(() => {
    fetchUserRates();
    fetchUsernames();
    fetchPrefixes();
  }, []);

  const fetchUserRates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/admin/Userrate/afficher`);
      setUserRates(response.data.userRates);
    } catch (error) {
      console.error('Error fetching user rates:', error);
      setError('Failed to fetch user rates');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsernames = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/Userrate/usernames`);
      setUsernames(response.data.usernames);
    } catch (error) {
      console.error('Error fetching usernames:', error);
    }
  };

  const fetchPrefixes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/Userrate/prefixes`);
      setPrefixes(response.data.prefixes);
    } catch (error) {
      console.error('Error fetching prefixes:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rate?')) {
      try {
        await axios.delete(`${API_BASE_URL}/admin/Userrate/supprimer/${id}`);
        await fetchUserRates();
        setSuccessMessage('Rate deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error('Error deleting rate:', error);
        setError('Failed to delete rate');
      }
    }
  };

  const handleAdd = () => {
    setModalData(DEFAULT_RATE_DATA);
    setShowModal(true);
  };

  const handleEdit = (rate) => {
    setModalData(rate);
    setShowModal(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Ensure we have all required fields
      if (!modalData.id_user || !modalData.id_prefix || !modalData.rateinitial || !modalData.initblock || !modalData.billingblock) {
        setError('Please fill in all required fields: Username, Prefix, Initial Rate, Init Block, and Billing Block');
        return;
      }

      const data = {
        id_user: Number(modalData.id_user),
        id_prefix: Number(modalData.id_prefix),
        rate: Number(modalData.rateinitial),
        initblock: Number(modalData.initblock),
        billingblock: Number(modalData.billingblock)
      };

      console.log('Sending update data:', data);

      console.log('Sending data:', data);

      if (modalData.id) {
        await axios.put(`${API_BASE_URL}/admin/Userrate/modifier/${modalData.id}`, data);
        setSuccessMessage('Rate updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/Userrate/ajouter`, data)
          .catch(error => {
            console.error('Error details:', error.response?.data);
            setError(error.response?.data?.error || 'Failed to save rate');
            throw error;
          });
        setSuccessMessage('Rate created successfully');
      }
      
      await fetchUserRates();
      setShowModal(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error saving rate:', error);
      setError(error.response?.data?.error || 'Failed to save rate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setModalData(prev => ({ ...prev, [name]: value }));
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  const filteredRates = userRates.filter(rate =>
    rate.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.prefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rate.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pageCount = Math.ceil(filteredRates.length / ITEMS_PER_PAGE);
  const currentRates = filteredRates.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  return (
    <div className="container mt-4">
      <UserRatesHeader
        onAddClick={handleAdd}
        rates={userRates}
        isExporting={false}
      />

      <Container fluid className="mt-4">
        <Row>
          <Col>
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <SearchBar 
                      searchTerm={searchTerm} 
                      onSearchChange={(e) => setSearchTerm(e.target.value)} 
                    />
                    <Badge bg="primary">
                      Total: {userRates.length}
                    </Badge>
                  </div>
                </div>

                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}

                {successMessage && (
                  <Alert variant="success" className="mb-4">
                    {successMessage}
                  </Alert>
                )}

                <RatesTableComponent
                  rates={currentRates}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isLoading={loading}
                  prefixes={prefixes}
                />

                <PaginationSection
                  pageCount={pageCount}
                  onPageChange={handlePageChange}
                  currentPage={currentPage}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <RateModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title={modalData.id ? "Edit Rate" : "Add New Rate"}
        onSubmit={handleModalSubmit}
        modalData={modalData}
        onInputChange={handleInputChange}
        isSubmitting={isSubmitting}
        usernames={usernames}
        prefixes={prefixes}
      />
    </div>
  );
}

export default UserCustomRates;
