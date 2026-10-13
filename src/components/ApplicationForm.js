import { useState } from 'react';
import { Button, LoadingState, Modal, SelectInput, TextInput } from './UI';

const statuses = ['Applied', 'Interview', 'Offer', 'Rejected'];

function localToday() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function ApplicationForm({ application, loading, saving, error, onClose, onSubmit }) {
  const [companyName, setCompanyName] = useState(application?.companyName || '');
  const [jobTitle, setJobTitle] = useState(application?.jobTitle || '');
  const [applicationDate, setApplicationDate] = useState(application?.applicationDate?.slice(0, 10) || localToday());
  const [status, setStatus] = useState(application?.status || 'Applied');
  const [notes, setNotes] = useState(application?.notes || '');
  const [fieldErrors, setFieldErrors] = useState({});

  const changeField = (field, setter, value) => {
    setter(value);
    setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const submit = (event) => {
    event.preventDefault();
    const errors = {};
    if (!companyName.trim()) errors.companyName = 'Company name is required.';
    if (!jobTitle.trim()) errors.jobTitle = 'Job title is required.';
    if (!applicationDate) errors.applicationDate = 'Application date is required.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      return;
    }
    onSubmit({ companyName: companyName.trim(), jobTitle: jobTitle.trim(), applicationDate, status, notes });
  };

  return (
      <Modal className="application-modal" labelledBy="application-form-title" onClose={onClose} closeDisabled={saving}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{application ? 'APPLICATION DETAILS' : 'NEW OPPORTUNITY'}</p>
            <h2 id="application-form-title">{application ? 'Edit job application' : 'Add a job application'}</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Close form" onClick={onClose} disabled={saving}>×</button>
        </div>
        {loading ? <LoadingState message="Loading application…" /> : <form className="application-form" onSubmit={submit} noValidate>
          <TextInput id="company-name" label="Company name" value={companyName} onChange={(event) => changeField('companyName', setCompanyName, event.target.value)} error={fieldErrors.companyName} required aria-required="true" disabled={saving} />
          <TextInput id="job-title" label="Job title" value={jobTitle} onChange={(event) => changeField('jobTitle', setJobTitle, event.target.value)} error={fieldErrors.jobTitle} required aria-required="true" disabled={saving} />
          <TextInput id="application-date" label="Application date" type="date" value={applicationDate} onChange={(event) => changeField('applicationDate', setApplicationDate, event.target.value)} error={fieldErrors.applicationDate} required aria-required="true" disabled={saving} />
          <SelectInput id="application-status" label="Status" value={status} onChange={(event) => setStatus(event.target.value)} disabled={saving}>
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectInput>
          <label className="notes-field" htmlFor="application-notes">Notes <span>Optional</span></label>
          <textarea id="application-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows="3" disabled={saving} />
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">
            <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : (application ? 'Save changes' : 'Save application')}</Button>
          </div>
        </form>}
      </Modal>
  );
}

export default ApplicationForm;
