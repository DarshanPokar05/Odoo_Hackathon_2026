import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '../api/departmentsApi';
import { categoriesApi } from '../api/categoriesApi';
import { employeesApi } from '../api/employeesApi';
import { TagChip } from '../components/TagChip';
import { useAuth } from '../hooks/useAuth';

export function OrgSetup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Active Tab: 'departments' | 'categories' | 'employees'
  const [activeTab, setActiveTab] = useState('departments');

  // Modals state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', headUserId: '', parentDepartmentId: '', status: 'Active' });

  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', customFields: [] });

  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [promoteForm, setPromoteForm] = useState({ role: 'Employee', departmentId: '' });

  // Employee Directory Filters
  const [empFilters, setEmpFilters] = useState({ departmentId: '', role: '', status: '', search: '' });

  // Guard: Admin only
  if (user?.role !== 'Admin') {
    return (
      <div className="bg-surface border border-border rounded-[8px] p-8 text-center text-red-400 font-mono">
        Access Forbidden: Organization Setup is restricted strictly to Admin users.
      </div>
    );
  }

  // Queries
  const { data: deptData, isLoading: deptsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.list(),
  });
  const departments = Array.isArray(deptData?.data)
    ? deptData.data
    : deptData?.data?.departments || deptData?.departments || [];

  const { data: catData, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  });
  const categories = Array.isArray(catData?.data)
    ? catData.data
    : catData?.data?.categories || catData?.categories || [];

  const { data: empData, isLoading: empsLoading } = useQuery({
    queryKey: ['employees', empFilters],
    queryFn: () => employeesApi.list(empFilters),
  });
  const employees = Array.isArray(empData?.data)
    ? empData.data
    : Array.isArray(empData?.data?.data)
    ? empData.data.data
    : empData?.data?.items || empData?.items || [];

  // Mutations - Departments
  const saveDeptMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingDept) {
        return departmentsApi.update(editingDept.id, payload);
      }
      return departmentsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setShowDeptModal(false);
      setEditingDept(null);
    },
  });

  const toggleDeptStatusMutation = useMutation({
    mutationFn: ({ id, status }) => departmentsApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });

  // Mutations - Categories
  const saveCatMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingCat) {
        return categoriesApi.update(editingCat.id, payload);
      }
      return categoriesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowCatModal(false);
      setEditingCat(null);
    },
  });

  // Mutations - Employee Promote
  const promoteEmployeeMutation = useMutation({
    mutationFn: ({ id, role, departmentId }) => employeesApi.updateRole(id, role, departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setShowPromoteModal(false);
      setSelectedEmployee(null);
    },
  });

  const toggleEmpStatusMutation = useMutation({
    mutationFn: ({ id, status }) => employeesApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  // Handlers
  const handleOpenAdd = () => {
    if (activeTab === 'departments') {
      setEditingDept(null);
      setDeptForm({ name: '', headUserId: '', parentDepartmentId: '', status: 'Active' });
      setShowDeptModal(true);
    } else if (activeTab === 'categories') {
      setEditingCat(null);
      setCatForm({ name: '', customFields: [] });
      setShowCatModal(true);
    }
  };

  const addCustomField = () => {
    setCatForm((prev) => ({
      ...prev,
      customFields: [...prev.customFields, { field_name: '', field_type: 'text', required: false }],
    }));
  };

  const removeCustomField = (index) => {
    setCatForm((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }));
  };

  const updateCustomField = (index, key, value) => {
    setCatForm((prev) => {
      const updated = [...prev.customFields];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, customFields: updated };
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-textPrimary">Organization Setup</h1>
          <p className="text-sm text-textSecondary mt-1">
            Configure enterprise departments, asset categories, and promote employee access roles
          </p>
        </div>

        {/* Persistent + Add Button */}
        {activeTab !== 'employees' && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-[6px] bg-accent text-bg font-mono text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            + Add {activeTab === 'departments' ? 'Department' : 'Category'}
          </button>
        )}
      </div>

      {/* Top Button-Row Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2 rounded-[6px] font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'departments'
              ? 'bg-accentSoft text-accent border border-accent/40'
              : 'text-textSecondary hover:text-textPrimary bg-surfaceAlt'
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-[6px] font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'categories'
              ? 'bg-accentSoft text-accent border border-accent/40'
              : 'text-textSecondary hover:text-textPrimary bg-surfaceAlt'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 rounded-[6px] font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'employees'
              ? 'bg-accentSoft text-accent border border-accent/40'
              : 'text-textSecondary hover:text-textPrimary bg-surfaceAlt'
          }`}
        >
          Employee Directory
        </button>
      </div>

      {/* TAB A: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="space-y-3">
          <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surfaceAlt text-xs font-mono uppercase text-textSecondary">
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Head</th>
                  <th className="py-3 px-4">Parent Dept</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm font-mono">
                {deptsLoading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-textSecondary">
                      Loading departments...
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-textSecondary">
                      No departments configured yet.
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-surfaceAlt/50">
                      <td className="py-3 px-4 font-semibold text-textPrimary">{dept.name}</td>
                      <td className="py-3 px-4 text-textSecondary">
                        {dept.head_name || dept.head_email || 'Not Assigned'}
                      </td>
                      <td className="py-3 px-4 text-textSecondary">
                        {dept.parent_department_name || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <TagChip
                          status={dept.status === 'Active' ? 'AVAILABLE' : 'RETIRED'}
                          label={dept.status}
                        />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingDept(dept);
                            setDeptForm({
                              name: dept.name,
                              headUserId: dept.head_user_id || '',
                              parentDepartmentId: dept.parent_department_id || '',
                              status: dept.status,
                            });
                            setShowDeptModal(true);
                          }}
                          className="text-xs text-accent hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            toggleDeptStatusMutation.mutate({
                              id: dept.id,
                              status: dept.status === 'Active' ? 'Inactive' : 'Active',
                            })
                          }
                          className="text-xs text-textSecondary hover:text-textPrimary"
                        >
                          {dept.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Footnote text under table per exact spec */}
          <p className="text-xs font-mono text-textSecondary italic">
            * Editing a department here also drives the picklist in Screen 4 &amp; 5
          </p>
        </div>
      )}

      {/* TAB B: ASSET CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-3">
          <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surfaceAlt text-xs font-mono uppercase text-textSecondary">
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Custom Fields Configured</th>
                  <th className="py-3 px-4">Asset Count</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm font-mono">
                {catsLoading ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-textSecondary">
                      Loading categories...
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-textSecondary">
                      No categories configured yet.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => {
                    const fields = Array.isArray(cat.custom_fields) ? cat.custom_fields : [];
                    return (
                      <tr key={cat.id} className="hover:bg-surfaceAlt/50">
                        <td className="py-3 px-4 font-semibold text-textPrimary">{cat.name}</td>
                        <td className="py-3 px-4 text-textSecondary">
                          {fields.length === 0 ? (
                            'Standard fields only'
                          ) : (
                            <span>
                              {fields.map((f) => f.field_name).join(', ')} ({fields.length})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-textSecondary">{cat.asset_count || 0} assets</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingCat(cat);
                              setCatForm({
                                name: cat.name,
                                customFields: Array.isArray(cat.custom_fields)
                                  ? cat.custom_fields
                                  : [],
                              });
                              setShowCatModal(true);
                            }}
                            className="text-xs text-accent hover:underline"
                          >
                            Configure Fields
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB C: EMPLOYEE DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 bg-surface border border-border p-3 rounded-[8px]">
            <input
              type="text"
              placeholder="Search employee name or email..."
              value={empFilters.search}
              onChange={(e) => setEmpFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="bg-surfaceAlt border border-border rounded-[6px] px-3 py-1.5 text-xs font-mono text-textPrimary focus:outline-none focus:border-accent"
            />
            <select
              value={empFilters.departmentId}
              onChange={(e) => setEmpFilters((prev) => ({ ...prev, departmentId: e.target.value }))}
              className="bg-surfaceAlt border border-border rounded-[6px] px-3 py-1.5 text-xs font-mono text-textPrimary focus:outline-none focus:border-accent"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              value={empFilters.role}
              onChange={(e) => setEmpFilters((prev) => ({ ...prev, role: e.target.value }))}
              className="bg-surfaceAlt border border-border rounded-[6px] px-3 py-1.5 text-xs font-mono text-textPrimary focus:outline-none focus:border-accent"
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="AssetManager">Asset Manager</option>
              <option value="DepartmentHead">Department Head</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          {/* Employee Table */}
          <div className="bg-surface border border-border rounded-[8px] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surfaceAlt text-xs font-mono uppercase text-textSecondary">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm font-mono">
                {empsLoading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-textSecondary">
                      Loading employees...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-textSecondary">
                      No employees match current filters.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-surfaceAlt/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-textPrimary">{emp.name}</div>
                        <div className="text-xs text-textSecondary">{emp.email}</div>
                      </td>
                      <td className="py-3 px-4 text-textSecondary">
                        {emp.department_name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-surfaceAlt border border-border text-textPrimary font-semibold">
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <TagChip
                          status={emp.status === 'Active' ? 'AVAILABLE' : 'RETIRED'}
                          label={emp.status}
                        />
                      </td>
                      <td className="py-3 px-4 text-right space-x-3">
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setPromoteForm({
                              role: emp.role,
                              departmentId: emp.department_id || '',
                            });
                            setShowPromoteModal(true);
                          }}
                          className="text-xs text-accent font-semibold hover:underline"
                        >
                          Promote / Change Role
                        </button>
                        <button
                          onClick={() =>
                            toggleEmpStatusMutation.mutate({
                              id: emp.id,
                              status: emp.status === 'Active' ? 'Inactive' : 'Active',
                            })
                          }
                          className="text-xs text-textSecondary hover:text-textPrimary"
                        >
                          {emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DEPARTMENT MODAL */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-border rounded-[8px] w-full max-w-md p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-textPrimary">
              {editingDept ? 'Edit Department' : 'Create Department'}
            </h3>

            {saveDeptMutation.isError && (
              <div className="p-3 rounded-[6px] bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                {saveDeptMutation.error?.response?.data?.error?.message ||
                  saveDeptMutation.error?.message ||
                  'Failed to save department. Please check fields.'}
              </div>
            )}

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-textSecondary mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-textSecondary mb-1">Department Head (User)</label>
                <select
                  value={deptForm.headUserId || ''}
                  onChange={(e) =>
                    setDeptForm((prev) => ({ ...prev, headUserId: e.target.value || null }))
                  }
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                >
                  <option value="">No Head Assigned</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.email}) — {e.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-textSecondary mb-1">Parent Department</label>
                <select
                  value={deptForm.parentDepartmentId || ''}
                  onChange={(e) =>
                    setDeptForm((prev) => ({
                      ...prev,
                      parentDepartmentId: e.target.value || null,
                    }))
                  }
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                >
                  <option value="">None (Top-Level Department)</option>
                  {departments
                    .filter((d) => !editingDept || d.id !== editingDept.id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeptModal(false)}
                className="px-4 py-2 rounded-[6px] border border-border text-xs font-mono text-textSecondary hover:text-textPrimary"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  saveDeptMutation.mutate({
                    ...deptForm,
                    headUserId: deptForm.headUserId || null,
                    parentDepartmentId: deptForm.parentDepartmentId || null,
                  })
                }
                className="px-4 py-2 rounded-[6px] bg-accent text-bg text-xs font-mono font-semibold uppercase hover:opacity-90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY & DYNAMIC CUSTOM-FIELD BUILDER MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-border rounded-[8px] w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-lg text-textPrimary">
              {editingCat ? 'Configure Asset Category & Custom Fields' : 'Create Asset Category'}
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-textSecondary mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                />
              </div>

              {/* Dynamic Custom Field Builder */}
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-textPrimary">
                    Dynamic Custom Fields Schema
                  </span>
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="px-3 py-1 rounded bg-surfaceAlt border border-border text-accent text-xs hover:border-accent"
                  >
                    + Add Custom Field
                  </button>
                </div>

                {catForm.customFields.length === 0 ? (
                  <p className="text-textSecondary italic">
                    No custom fields defined. Assets in this category will use standard inventory
                    fields.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {catForm.customFields.map((field, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-surfaceAlt p-2.5 rounded border border-border"
                      >
                        <input
                          type="text"
                          placeholder="Field Name (e.g. warranty_months)"
                          value={field.field_name}
                          onChange={(e) =>
                            updateCustomField(index, 'field_name', e.target.value)
                          }
                          className="flex-1 bg-surface border border-border rounded px-2 py-1 text-textPrimary"
                        />
                        <select
                          value={field.field_type}
                          onChange={(e) =>
                            updateCustomField(index, 'field_type', e.target.value)
                          }
                          className="bg-surface border border-border rounded px-2 py-1 text-textPrimary"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="boolean">Boolean</option>
                        </select>
                        <label className="flex items-center gap-1 text-textSecondary select-none">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              updateCustomField(index, 'required', e.target.checked)
                            }
                          />
                          Req.
                        </label>
                        <button
                          type="button"
                          onClick={() => removeCustomField(index)}
                          className="text-red-400 hover:text-red-300 px-1 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setShowCatModal(false)}
                className="px-4 py-2 rounded-[6px] border border-border text-xs font-mono text-textSecondary hover:text-textPrimary"
              >
                Cancel
              </button>
              <button
                onClick={() => saveCatMutation.mutate(catForm)}
                className="px-4 py-2 rounded-[6px] bg-accent text-bg text-xs font-mono font-semibold uppercase hover:opacity-90"
              >
                Save Schema
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROLE PROMOTION MODAL */}
      {showPromoteModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface border border-border rounded-[8px] w-full max-w-md p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-textPrimary">
              Promote Employee Access Role
            </h3>
            <p className="text-xs font-mono text-textSecondary">
              Target: <span className="text-textPrimary font-semibold">{selectedEmployee.name}</span> ({selectedEmployee.email})
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-textSecondary mb-1">New Role</label>
                <select
                  value={promoteForm.role}
                  onChange={(e) =>
                    setPromoteForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="w-full bg-surfaceAlt border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                >
                  <option value="Employee">Employee</option>
                  <option value="DepartmentHead">Department Head</option>
                  <option value="AssetManager">Asset Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Conditional Department Picker when promoting to Department Head per spec */}
              {promoteForm.role === 'DepartmentHead' && (
                <div className="bg-accentSoft/30 border border-accent/40 p-3 rounded-[6px] space-y-2">
                  <label className="block text-accent font-semibold">
                    Assign Head of Department *
                  </label>
                  <select
                    value={promoteForm.departmentId}
                    onChange={(e) =>
                      setPromoteForm((prev) => ({ ...prev, departmentId: e.target.value }))
                    }
                    className="w-full bg-surface border border-border rounded-[6px] px-3 py-2 text-textPrimary focus:outline-none focus:border-accent"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-textSecondary">
                    * This user will be automatically designated as the head of the chosen department.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPromoteModal(false)}
                className="px-4 py-2 rounded-[6px] border border-border text-xs font-mono text-textSecondary hover:text-textPrimary"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  promoteEmployeeMutation.mutate({
                    id: selectedEmployee.id,
                    role: promoteForm.role,
                    departmentId: promoteForm.departmentId,
                  })
                }
                className="px-4 py-2 rounded-[6px] bg-accent text-bg text-xs font-mono font-semibold uppercase hover:opacity-90"
              >
                Confirm Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrgSetup;
