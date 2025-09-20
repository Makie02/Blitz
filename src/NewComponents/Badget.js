import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2';

const ROW_OPTIONS = [5, 10, 20];

const Badget = () => {
  const [badgets, setBadgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    id: null,
    pwp_code: '',
    amountbadget: '',
    createduser: '',
    remainingbalance: '',
    approved: false,
  });
  const [isEditing, setIsEditing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Fetch data from Supabase
  const fetchBadgets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('amount_badget')
      .select('*')
      .order('createdate', { ascending: false });

    if (error) {
      Swal.fire('Error', 'Error fetching badgets: ' + error.message, 'error');
    } else {
      setBadgets(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBadgets();
  }, []);

  // Open modal for edit
  const openEditModal = (badget) => {
    setForm({
      id: badget.id,
      pwp_code: badget.pwp_code,
      amountbadget: badget.amountbadget,
      createduser: badget.createduser,
      remainingbalance: badget.remainingbalance,
      approved: badget.Approved || false,
    });
    setIsEditing(true);
    setModalOpen(true);
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle form submission (update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.pwp_code.trim()) {
      Swal.fire('Validation Error', 'PWP Code is required.', 'warning');
      return;
    }
    if (form.amountbadget === '' || isNaN(Number(form.amountbadget))) {
      Swal.fire('Validation Error', 'Valid Amount Badget is required.', 'warning');
      return;
    }
    if (!form.createduser.trim()) {
      Swal.fire('Validation Error', 'Created User is required.', 'warning');
      return;
    }
    if (form.remainingbalance === '' || isNaN(Number(form.remainingbalance))) {
      Swal.fire('Validation Error', 'Valid Remaining Balance is required.', 'warning');
      return;
    }

    // Update record in Supabase
    const { error } = await supabase
      .from('amount_badget')
      .update({
        pwp_code: form.pwp_code,
        amountbadget: Number(form.amountbadget),
        createduser: form.createduser,
        remainingbalance: Number(form.remainingbalance),
        Approved: form.approved,
      })
      .eq('id', form.id);

    if (error) {
      Swal.fire('Update Error', error.message, 'error');
    } else {
      Swal.fire('Success', 'Badget updated successfully!', 'success');
      setModalOpen(false);
      fetchBadgets();
    }
  };

  // Filter badgets by search term
  const filteredBadgets = badgets.filter((b) => {
    const term = searchTerm.toLowerCase();
    return (
      b.pwp_code.toLowerCase().includes(term) ||
      b.createduser.toLowerCase().includes(term)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredBadgets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredBadgets.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page < 1) page = 1;
    else if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  return (
    <div style={containerStyle}>
      <h2>Amount Badget</h2>

      <div style={searchWrapperStyle}>
        <input
          type="text"
          placeholder="Search by PWP Code or User..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          style={searchInputStyle}
        />
      </div>

      <div style={tableWrapperStyle}>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>PWP Code</th>
                  <th style={thStyle}>Amount Badget</th>
                  <th style={thStyle}>Created User</th>
                  <th style={thStyle}>Created Date</th>
                  <th style={thStyle}>Remaining Balance</th>
                  <th style={thStyle}>Approved</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: 12, textAlign: 'center' }}>
                      No badgets found.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={tdStyle}>{b.id}</td>
                      <td style={tdStyle}>{b.pwp_code}</td>
                      <td style={tdStyle}>
                        {Number(b.amountbadget).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td style={tdStyle}>{b.createduser}</td>
                      <td style={tdStyle}>
                        {new Date(b.createdate).toLocaleString() || '-'}
                      </td>
                      <td style={tdStyle}>
                        {Number(b.remainingbalance).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td style={tdStyle}>{b.Approved ? 'Yes' : 'No'}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => openEditModal(b)}
                          style={actionBtnStyle}
                        >
                          View / Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div style={footerStyle}>
              <div>
                <label htmlFor="rowsPerPage" style={{ marginRight: '6px' }}>
                  Rows per page:
                </label>
                <select
                  id="rowsPerPage"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  style={selectStyle}
                >
                  {ROW_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div style={paginationStyle}>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    ...pageButtonStyle,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1,
                  }}
                >
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    style={currentPage === page ? activePageButtonStyle : pageButtonStyle}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{
                    ...pageButtonStyle,
                    cursor:
                      currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages || totalPages === 0 ? 0.5 : 1,
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Edit Badget</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label>PWP Code: *</label>
                <input
                  type="text"
                  name="pwp_code"
                  value={form.pwp_code}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label>Amount Badget: *</label>
                <input
                  type="number"
                  step="0.01"
                  name="amountbadget"
                  value={form.amountbadget}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label>Created User: *</label>
                <input
                  type="text"
                  name="createduser"
                  value={form.createduser}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label>Remaining Balance: *</label>
                <input
                  type="number"
                  step="0.01"
                  name="remainingbalance"
                  value={form.remainingbalance}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label>
                  <input
                    type="checkbox"
                    name="approved"
                    checked={form.approved}
                    onChange={handleChange}
                    style={{ marginRight: '8px' }}
                  />
                  Approved
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ ...actionBtnStyle, backgroundColor: '#6c757d' }}
                >
                  Cancel
                </button>
                <button type="submit" style={actionBtnStyle}>
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// === Reusable Styles (same style as your Account component) ===

const containerStyle = {
  padding: '20px',
  maxWidth: 1500,
  margin: '0 auto',
  backgroundColor: '#fdfdfdff',
  borderRadius: '12px',
};

const tableWrapperStyle = { overflowX: 'auto' };

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: '700px',
};

const thStyle = {
  padding: '12px',
  textAlign: 'left',
  backgroundColor: '#0062ffff',
  color: 'white',
};

const tdStyle = { padding: '12px' };

const actionBtnStyle = {
  marginRight: '8px',
  padding: '6px 12px',
  cursor: 'pointer',
  border: 'none',
  borderRadius: '4px',
  color: 'white',
  backgroundColor: '#007bff',
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '10px',
};

const modalContentStyle = {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '8px',
  width: '100%',
  maxWidth: '450px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
};

const inputStyle = {
  width: '100%',
  padding: '8px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  marginTop: '4px',
  fontSize: '14px',
  boxSizing: 'border-box',
};

const searchWrapperStyle = {
  marginBottom: '16px',
  textAlign: 'right',
};

const searchInputStyle = {
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  width: '240px',
  fontSize: '14px',
};

const footerStyle = {
  marginTop: '12px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const selectStyle = {
  padding: '6px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  fontSize: '14px',
};

const paginationStyle = {
  display: 'flex',
  gap: '6px',
};

const pageButtonStyle = {
  padding: '6px 12px',
  cursor: 'pointer',
  borderRadius: '4px',
  border: '1px solid #007bff',
  backgroundColor: 'white',
  color: '#007bff',
  fontWeight: '600',
};

const activePageButtonStyle = {
  ...pageButtonStyle,
  backgroundColor: '#007bff',
  color: 'white',
};

export default Badget;
