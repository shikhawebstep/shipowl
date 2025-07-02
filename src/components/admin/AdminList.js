"use client";
import React, { useState, useEffect } from 'react';
import { FaCheck } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { AiOutlineDelete } from 'react-icons/ai';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import Image from 'next/image';

const dummyPermissions = [
  { module: 'admin', panel: 'admin', action: 'listing' },
  { module: 'admin', panel: 'admin', action: 'view' },
  { module: 'admin', panel: 'admin', action: 'update' },
  { module: 'admin', panel: 'admin', action: 'soft-delete' },
  { module: 'dropshipper', panel: 'product-request', action: 'create' },
];

const staticAdminData = [
  {
    id: 1,
    name: 'John Doe',
    contact_name: 'john@example.com',
    contact_number: '1234567890',
    permissions: [],
    profilePicture: 'https://via.placeholder.com/40',
    type: 'main',
  },
  {
    id: 2,
    name: 'Jane Smith',
    contact_name: 'jane@example.com',
    contact_number: '9876543210',
    permissions: dummyPermissions,
    profilePicture: 'https://via.placeholder.com/40',
    type: 'sub',
  },
];

const EditAdminModal = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({ ...item, permissions: item.permissions || [] });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permission) => {
    setFormData((prev) => {
      const exists = prev.permissions?.some(
        (p) =>
          p.module === permission.module &&
          p.panel === permission.panel &&
          p.action === permission.action
      );

      const newPermissions = exists
        ? prev.permissions.filter(
            (p) =>
              !(
                p.module === permission.module &&
                p.panel === permission.panel &&
                p.action === permission.action
              )
          )
        : [...(prev.permissions || []), permission];

      return { ...prev, permissions: newPermissions };
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold mb-4">Edit Admin: {item.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={formData.id} />
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              name="contact_name"
              value={formData.contact_name}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input
              name="contact_number"
              value={formData.contact_number}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Profile Picture</label>
            {formData.profilePicture && (
              <Image height={100} width={100} src={formData.profilePicture} alt="Preview" className="w-20 h-20 rounded-full mb-2" />
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>

          <div>
            <label className="block text-sm font-medium">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="main">Main</option>
              <option value="sub">Sub</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Permissions</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded">
              {dummyPermissions.map((perm, idx) => {
                const label = `${perm.module} - ${perm.panel} - ${perm.action}`;
                const checked = formData.permissions?.some(
                  (p) =>
                    p.module === perm.module &&
                    p.panel === perm.panel &&
                    p.action === perm.action
                );
                return (
                  <label key={idx} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handlePermissionChange(perm)}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminList = () => {
  const [adminData, setAdminData] = useState(staticAdminData);
  const [selected, setSelected] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [viewPermItem, setViewPermItem] = useState(null);

  const handleCheckboxChange = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleEditItem = (item) => setEditItem(item);

  const handleSaveEdit = (updatedItem) => {
    setAdminData((prev) =>
      prev.map((admin) => (admin.id === updatedItem.id ? updatedItem : admin))
    );
  };

  const handleViewPermissions = (item) => setViewPermItem(item);

  useEffect(() => {
    if (typeof window !== 'undefined' && adminData.length > 0) {
      let table = null;

      Promise.all([
        import('jquery'),
        import('datatables.net'),
        import('datatables.net-dt'),
      ])
        .then(([jQuery]) => {
          const $ = jQuery.default;
          window.jQuery = window.$ = $;

          if ($.fn.DataTable.isDataTable('#adminTable')) {
            $('#adminTable').DataTable().destroy();
          }

          table = $('#adminTable').DataTable();
        })
        .catch(console.error);

      return () => {
        if (table) {
          table.destroy();
        }
      };
    }
  }, [adminData]);

  return (
    <>
      <div className="overflow-x-auto w-full relative bg-white p-4 rounded-md">
        <table className="w-full" id="adminTable">
          <thead>
            <tr className="border-b text-[#A3AED0] border-[#E9EDF7]">
              <th className="p-2 px-5 text-left uppercase">Name</th>
              <th className="p-2 px-5 text-left uppercase">Email</th>
              <th className="p-2 px-5 text-left uppercase">Permissions</th>
              <th className="p-2 px-5 text-left uppercase">Profile Picture</th>
              <th className="p-2 px-5 text-left uppercase">Type</th>
              <th className="p-2 px-5 text-left uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {adminData.map((item) => (
              <tr key={item.id} className="border-b border-[#E9EDF7] text-[#2B3674] font-semibold">
                <td className="p-2 px-5">
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer me-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => handleCheckboxChange(item.id)}
                        className="peer hidden"
                      />
                      <div className="w-4 h-4 border-2 border-[#A3AED0] rounded-sm flex items-center justify-center peer-checked:bg-[#F98F5C] peer-checked:border-0">
                        <FaCheck className="peer-checked:block text-white w-3 h-3" />
                      </div>
                    </label>
                    {item.name}
                  </div>
                </td>
                <td className="p-2 px-5">
                  {item.contact_name}<br />
                  {item.contact_number}
                </td>
                <td className="p-2 px-5">
                  {item.permissions && item.permissions.length > 0 ? (
                    <>
                      <div className="text-sm">{`${item.permissions[0].module} / ${item.permissions[0].panel} / ${item.permissions[0].action}`}</div>
                      {item.permissions.length > 1 && (
                        <button
                          onClick={() => handleViewPermissions(item)}
                          className="text-xs text-blue-500 underline mt-1"
                        >
                          View More
                        </button>
                      )}
                    </>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="p-2 px-5">
                  <img src={item.profilePicture} alt="Profile" className="w-10 h-10 rounded-full" />
                </td>
                <td className="p-2 px-5">{item.type}</td>
                <td className="p-2 px-5 text-[#8F9BBA]">
                  <div className="flex justify-center gap-2">
                    <MdModeEdit onClick={() => handleEditItem(item)} className="cursor-pointer text-3xl" />
                    <AiOutlineDelete className="cursor-pointer text-3xl" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewPermItem && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Permissions for {viewPermItem.name}</h2>
              <button onClick={() => setViewPermItem(null)} className="text-gray-600 text-xl">&times;</button>
            </div>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {viewPermItem.permissions?.map((perm, idx) => (
                <li key={idx}>{`${perm.module} / ${perm.panel} / ${perm.action}`}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {editItem && (
        <EditAdminModal item={editItem} onClose={() => setEditItem(null)} onSave={handleSaveEdit} />
      )}
    </>
  );
};

export default AdminList;
