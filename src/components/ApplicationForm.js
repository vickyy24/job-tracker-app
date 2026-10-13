import { useState } from 'react';
import { Button, SelectInput, TextInput } from './UI';

const statuses = ['Applied', 'Interview', 'Offer', 'Rejected'];

function localToday() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function ApplicationForm({ saving, error, onClose, onSubmit }) {
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [applicationDate, setApplicationDate] = useState(localToday());
  const [status, setStatus] = useState('Applied');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (!companyName.trim() || !jobTitle.trim()) {
      setValidationError('Company name and job title are required.');
      return;
    }
    setValidationError('');
    onSubmit({ companyName: companyName.trim(), jobTitle: jobTitle.trim(), applicationDate, status, notes });
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <section className="application-modal" role="dialog" aria-modal="true" aria-labelledby="application-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">NEW OPPORTUNITY</p>
            <h2 id="application-form-title">Add a job application</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Close form" onClick={onClose} disabled={saving}>×</button>
        </div>
        <form className="application-form" onSubmit={submit}>
          <TextInput id="company-name" label="Company name" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required autoFocus />
          <TextInput id="job-title" label="Job title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} required />
          <TextInput id="application-date" label="Application date" type="date" value={applicationDate} onChange={(event) => setApplicationDate(event.target.value)} required />
          <SelectInput id="application-status" label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
            {statuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectInput>
          <label className="notes-field" htmlFor="application-notes">Notes <span>Optional</span></label>
          <textarea id="application-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows="3" />
          {(validationError || error) && <p className="form-error" role="alert">{validationError || error}</p>}
          <div className="form-actions">
            <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save application'}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ApplicationForm;
