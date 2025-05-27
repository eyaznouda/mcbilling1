"use client"

import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Table, Button, Modal, Form, Dropdown, Alert, Card, Container, Row, Col, Badge, Spinner } from "react-bootstrap";
import ReactPaginate from "react-paginate";
import { CSVLink } from "react-csv";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaSearch,
  FaDownload,
  FaPlusCircle,
  FaTrashAlt,
  FaTicketAlt,
  FaUsers,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

// Constants
const ITEMS_PER_PAGE = 10;

const DEFAULT_VOUCHER_DATA = {
  credit: '',
  plan: '',
  language: '',
  prefix_local: '',
  used: '',
  tag: '',
  id: null,
  voucher: '',
  usedate: '',
  expirationdate: '',
  creationdate: '',
};

// Header with Export & Add
function VoucherHeader({ onAddClick, vouchers, isExporting }) {
  const csvData = [
    ["Credit", "Voucher", "Language", "Description", "Use Date", "Creation Date"],
    ...vouchers.map((voucher) => [
      voucher.credit,
      voucher.voucher,
      voucher.language,
      voucher.description || '',
      voucher.usedate,
      voucher.creationdate,
    ]),
  ];

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
                <FaTicketAlt
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
            <FaTicketAlt className="text-primary fs-3" />
          </div>
          <div>
            <h2 className="fw-bold mb-0 text-white">Gestion des Vouchers</h2>
            <p className="text-white-50 mb-0 d-none d-md-block">Gérez vos vouchers facilement</p>
          </div>
        </div>
      </div>
      <div className="w-100 bg-white p-2 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <Badge bg="primary" className="d-flex align-items-center p-2 ps-3 rounded-pill">
            <span className="me-2 fw-normal">
              Total: <span className="fw-bold">{vouchers.length}</span>
            </span>
            <span
              className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: "24px", height: "24px" }}
            >
              <FaTicketAlt size={12} />
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
            <span>Ajouter</span>
          </Button>
          <CSVLink
            data={csvData}
            filename={"vouchers.csv"}
            className="btn btn-success d-flex align-items-center gap-2 fw-semibold btn-hover-effect"
            disabled={isExporting}
          >
            <div className="icon-container">
              {isExporting ? <Spinner animation="border" size="sm" /> : <FaDownload />}
            </div>
            <span>{isExporting ? "Exportation..." : "Exporter"}</span>
          </CSVLink>
        </div>
      </div>
    </Card.Header>
  );
}

// Search Bar
function SearchBar({ searchTerm, onSearchChange }) {
  return (
    <div className="search-container position-relative">
      <div className="input-group">
        <span className="input-group-text bg-white border-end-0">
          <FaSearch className="text-muted" />
        </span>
        <Form.Control
          type="text"
          placeholder="Rechercher un voucher..."
          value={searchTerm}
          onChange={onSearchChange}
          className="border-start-0 shadow-none ps-0"
        />
      </div>
    </div>
  );
}

// Status Badge
function StatusBadge({ status }) {
  if (status === "1" || status === 1 || status === true) {
    return (
      <Badge bg="success" className="d-flex align-items-center gap-1 px-2 py-1">
        <FaCheckCircle size={10} />
        <span>Actif</span>
      </Badge>
    );
  }
  return (
    <Badge bg="danger" className="d-flex align-items-center gap-1 px-2 py-1">
      <FaTimesCircle size={10} />
      <span>Inactif</span>
    </Badge>
  );
}

// Action Buttons
function ActionButtons({ onEdit, onDelete }) {
  return (
    <div className="d-flex gap-2">
      <Button
        variant="light"
        size="sm"
        onClick={onEdit}
        className="rounded-circle p-2 d-flex align-items-center justify-content-center action-btn"
        title="Modifier"
      >
        <FaEdit className="btn-icon text-primary" />
      </Button>
      <Button
        variant="light"
        size="sm"
        onClick={onDelete}
        className="rounded-circle p-2 d-flex align-items-center justify-content-center action-btn"
        title="Supprimer"
      >
        <FaTrashAlt className="btn-icon text-danger" />
      </Button>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className="text-center py-5">
      <div className="mb-3">
        <FaTicketAlt size={48} className="text-muted" />
      </div>
      <h4>Aucun voucher trouvé</h4>
      <p className="text-muted">Ajoutez un nouveau voucher pour commencer</p>
    </div>
  );
}

// Helper function to format dates
const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Table
const VoucherTable = ({ vouchers, onEdit, onDelete, isLoading }) => {
  if (!vouchers || vouchers.length === 0) return <EmptyState />;

  return (
    <Table striped hover responsive className="mt-3">
      <thead>
        <tr>
          <th>Utilisateur</th>
          <th>Voucher</th>
          <th>Crédit</th>
          <th>Description</th>
          <th>Création</th>
          <th>Dernière Utilisation</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {vouchers.map((voucher) => (
          <tr key={voucher.id}>
            <td>{voucher.id_user || '-'}</td>
            <td>{voucher.voucher}</td>
            <td>{voucher.credit}</td>
            <td>{voucher.tag || '-'}</td>
            <td>{formatDateTime(voucher.creationdate)}</td>
            <td>{formatDateTime(voucher.usedate)}</td>
            <td>
              <ActionButtons onEdit={() => onEdit(voucher)} onDelete={() => onDelete(voucher.id)} />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

// Pagination
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
      forcePage={currentPage}
    />
  );
}

// Modal Form
function VoucherModal({ show, onHide, title, onSubmit, voucherData, plans, onInputChange, isSubmitting }) {
  const languages = [
    { value: '', label: 'Undefined' },
    { value: 'English', label: 'English' },
    { value: 'Portuguese', label: 'Portuguese' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'Russian', label: 'Russian' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="fw-bold">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Credit</Form.Label>
                <Form.Control
                  type="number"
                  value={voucherData.credit}
                  onChange={(e) => onInputChange({ ...voucherData, credit: e.target.value })}
                  required
                  className="shadow-sm"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Plan</Form.Label>
                <Form.Select
                  value={voucherData.plan}
                  onChange={(e) => onInputChange({ ...voucherData, plan: e.target.value })}
                  required
                  className="shadow-sm"
                >
                  <option value="">Sélectionnez un plan</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Langue</Form.Label>
                <Form.Select 
                  name="language"
                  value={voucherData.language}
                  onChange={(e) => onInputChange({ ...voucherData, language: e.target.value })}
                  required
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Prefix Local</Form.Label>
                <Form.Control
                  type="text"
                  value={voucherData.prefix_local}
                  onChange={(e) => onInputChange({ ...voucherData, prefix_local: e.target.value })}
                  className="shadow-sm"
                />
                <Form.Text className="text-muted">
                  Format: match/replace/length
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Quantité</Form.Label>
                <Form.Control
                  type="number"
                  value={voucherData.used || 10}
                  onChange={(e) => onInputChange({ ...voucherData, used: e.target.value })}
                  className="shadow-sm"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Description</Form.Label>
                <Form.Control
                  type="text"
                  value={voucherData.description}
                  onChange={(e) => onInputChange({ ...voucherData, description: e.target.value })}
                  className="shadow-sm"
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Voucher</Form.Label>
            <Form.Control
              type="text"
              value="Will be generated automatically"
              readOnly
              className="bg-light"
            />
            <Form.Text className="text-muted">
              Le code voucher sera généré automatiquement lors de la création
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer className="bg-light">
        <Button variant="outline-secondary" onClick={onHide}>
          Annuler
        </Button>
        <Button 
          variant="primary" 
          onClick={onSubmit} 
          disabled={isSubmitting}
          className="d-flex align-items-center gap-2"
        >
          {isSubmitting && <Spinner animation="border" size="sm" />}
          {title.includes('Ajouter') ? 'Créer le voucher' : 'Mettre à jour'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function VoucherPage() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [plans, setPlans] = useState([]);
  const [modalData, setModalData] = useState(DEFAULT_VOUCHER_DATA);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch data from API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/admin/voucher/afficher');
      setData(response.data.vouchers);
      setFilteredData(response.data.vouchers);
      setSuccessMessage("Vouchers chargés avec succès");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setError("Erreur lors de la récupération des vouchers.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch plans from API
  const fetchPlans = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/voucher/plans');
      setPlans(response.data.plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      setError("Erreur lors de la récupération des plans.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Handle add voucher
  const handleAdd = () => {
    setModalData(DEFAULT_VOUCHER_DATA);
    setIsEditing(false);
    setShowModal(true);
  };

  // Handle edit voucher
  const handleEdit = (voucher) => {
    // Prepare data with all fields
    const voucherData = {
      ...voucher,
      credit: voucher.credit || '',
      plan: voucher.id_plan || '',
      used: voucher.used || 10,
      language: voucher.language || 'fr',
      prefix_local: voucher.prefix_local || '',
      description: voucher.tag || '',
      voucher: voucher.voucher || '',
      creationdate: voucher.creationdate || '',
      usedate: voucher.usedate || '',
      expirationdate: voucher.expirationdate || ''
    };
    setModalData(voucherData);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleModalSubmit = async () => {
    // 1. Préparation du payload
    const payload = {
      credit: Number(modalData.credit),
      id_plan: Number(modalData.plan),
      used: Number(modalData.used || 0),
      language: modalData.language || 'fr',
      prefix_local: modalData.prefix_local || '',
      description: modalData.description || '',
      voucher: Math.floor(Math.random() * 999999)
    };

    try {
      // 2. Envoi direct avec gestion d'erreur améliorée
      const res = await axios.post(
        'http://localhost:5000/api/admin/voucher/ajouter',
        payload,
        { 
          timeout: 3000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      // 3. Gestion réponse
      if (res.data?.success) {
        alert(`Voucher créé (ID: ${res.data.id})`);
        setModalData({
          credit: '',
          plan: '',
          quantity: '',
          language: 'fr',
          prefix_rules: '',
          description: ''
        });
      } else {
        throw new Error(res.data?.error || 'Réponse inattendue');
      }
    } catch (err) {
      // 4. Gestion d'erreur complète
      let errorMsg = 'Erreur lors de la création';
      
      if (err.code === 'ECONNABORTED') {
        errorMsg = 'Le serveur ne répond pas (timeout)';
      } else if (err.code === 'ERR_NETWORK') {
        errorMsg = 'Serveur inaccessible. Veuillez le démarrer.';
      } else if (err.response) {
        errorMsg = err.response.data?.error || err.message;
      }
      
      console.error('[VOUCHER ERROR]', {
        timestamp: new Date(),
        error: err.message,
        code: err.code,
        status: err.response?.status
      });
      
      alert(errorMsg);
    }
  };

  // Handle delete voucher
  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce voucher?")) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/voucher/supprimer/${id}`);
        setSuccessMessage("Voucher supprimé avec succès!");
        fetchData();
      } catch (error) {
        console.error("Erreur lors de la suppression du voucher", error);
        setError("Erreur lors de la suppression du voucher.");
      }
    }
  };

  // Handle search
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredData(data);
    } else {
      const filtered = data.filter(voucher => 
        voucher.voucher?.toLowerCase().includes(term) ||
        voucher.description?.toLowerCase().includes(term) ||
        voucher.tag?.toLowerCase().includes(term) ||
        voucher.language?.toLowerCase().includes(term)
      );
      setFilteredData(filtered);
    }
    setCurrentPage(0);
  };

  // Calculate pagination
  const pageCount = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedVouchers = filteredData.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  // Handle page change
  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected);
  };

  // Handle export
  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 1000);
  };

  // Update filtered data when data changes
  useEffect(() => {
    if (data.length > 0) {
      if (searchTerm.trim() === '') {
        setFilteredData(data);
      } else {
        handleSearch({ target: { value: searchTerm } });
      }
    }
  }, [data]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
    fetchPlans();
  }, []);

  // Add custom CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .btn-hover-effect {
        transition: all 0.3s ease;
      }
      .btn-hover-effect:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      .icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .action-btn {
        transition: all 0.2s ease;
        width: 38px;
        height: 38px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        border: none;
      }
      .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }
      .action-btn:hover .btn-icon.text-primary {
        transform: scale(1.2);
        color: #0d6efd !important;
      }
      .action-btn:hover .btn-icon.text-danger {
        transform: scale(1.2);
        color: #dc3545 !important;
      }
      .btn-icon {
        transition: all 0.2s ease;
        font-size: 1rem;
      }
      .floating-icon {
        position: absolute;
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
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .main-card {
        animation: fadeIn 0.5s ease-in-out;
      }
      .table-actions {
        display: flex;
        justify-content: center;
        gap: 8px;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="dashboard-main" style={{ marginLeft: "0px" }}>
      <Container fluid className="px-4 py-4">
        <Row className="justify-content-center">
          <Col xs={12} lg={11}>
            <Card className="shadow border-0 overflow-hidden main-card">
              <VoucherHeader
                onAddClick={handleAdd}
                vouchers={filteredData}
                isExporting={isExporting}
              />
              <Card.Body className="p-4" style={{ animation: "fadeIn 0.5s ease-in-out" }}>
                {error && (
                  <Alert variant="danger" className="d-flex align-items-center mb-4 shadow-sm">
                    <FaTimesCircle className="me-2" />
                    {error}
                  </Alert>
                )}
                {successMessage && (
                  <Alert variant="success" className="d-flex align-items-center mb-4 shadow-sm">
                    <FaCheckCircle className="me-2" />
                    {successMessage}
                  </Alert>
                )}

                <Row className="mb-4">
                  <Col md={6} lg={4}>
                    <SearchBar searchTerm={searchTerm} onSearchChange={handleSearch} />
                  </Col>
                </Row>

                <VoucherTable
                  vouchers={paginatedVouchers}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isLoading={isLoading}
                  formatDate={formatDate}
                />

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-4">
                  <div className="text-muted small">
                    {!isLoading && (
                      <>
                        <Badge bg="light" text="dark" className="me-2 shadow-sm">
                          <span className="fw-semibold">{paginatedVouchers.length}</span> sur {filteredData.length}{" "}
                          Vouchers
                        </Badge>
                        {searchTerm && (
                          <Badge bg="light" text="dark" className="shadow-sm">
                            Filtrés de {data.length} total
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  <PaginationSection
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

      <VoucherModal
        show={showModal}
        onHide={() => setShowModal(false)}
        title={isEditing ? 'Modifier Voucher' : 'Ajouter Voucher'}
        onSubmit={handleModalSubmit}
        voucherData={modalData}
        plans={plans}
        onInputChange={setModalData}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default VoucherPage;