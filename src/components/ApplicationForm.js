import { useState } from 'react';
import { Button, LoadingState, Modal, SelectInput, TextInput } from './UI';
import Icon from './Icon';

const statuses = ['Applied', 'Interview', 'Offer', 'Rejected'];

function localToday() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function ApplicationForm({ application, initialStatus = 'Applied', loading, saving, error, onClose, onSubmit }) {
  const [companyName, setCompanyName] = useState(application?.companyName || '');
  const [jobTitle, setJobTitle] = useState(application?.jobTitle || '');
  const [salary, setSalary] = useState(application?.salary || '');
  const [location, setLocation] = useState(application?.location || '');
  const [applicationDate, setApplicationDate] = useState(application?.applicationDate?.slice(0, 10) || localToday());
  const [status, setStatus] = useState(application?.status || initialStatus);
  const [notes, setNotes] = useState(application?.notes || '');
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [submission, setSubmission] = useState(null);

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
    setSubmission({ companyName: companyName.trim(), jobTitle: jobTitle.trim(), salary: salary.trim(), location: location.trim(), applicationDate, status, notes });
    setConfirming(true);
  };

  return (
      <Modal className="application-modal" labelledBy="application-form-title" onClose={() => { if (confirming) setConfirming(false); else onClose(); }} closeDisabled={saving}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{application ? 'APPLICATION DETAILS' : 'NEW OPPORTUNITY'}</p>
            <h2 id="application-form-title">{application ? 'Edit job application' : 'Add a job application'}</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Close form" title="Close" onClick={onClose} disabled={saving}><Icon name="close" size={16}/></button>
        </div>
        {loading ? <LoadingState message="Loading application…" /> : <form className="application-form" onSubmit={submit} noValidate>
          <TextInput id="company-name" label="Company name" value={companyName} onChange={(event) => changeField('companyName', setCompanyName, event.target.value)} error={fieldErrors.companyName} required aria-required="true" disabled={saving} />
          <TextInput id="job-title" label="Job title" value={jobTitle} onChange={(event) => changeField('jobTitle', setJobTitle, event.target.value)} error={fieldErrors.jobTitle} required aria-required="true" disabled={saving} />
          <TextInput id="job-salary" label="Salary" placeholder="e.g. Up to ₹6,000 per month" value={salary} onChange={(event) => setSalary(event.target.value)} disabled={saving} />
          <TextInput id="job-location" label="Location" placeholder="e.g. Surat, Gujarat" value={location} onChange={(event) => setLocation(event.target.value)} disabled={saving} />
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
        {confirming && <div className="save-confirmation-backdrop"><section className="save-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="save-confirmation-title" aria-describedby="save-confirmation-copy">
          <span className="save-confirmation-icon"><Icon name="check" size={20}/></span>
          <p className="eyebrow">REVIEW BEFORE SAVING</p>
          <h3 id="save-confirmation-title">{application ? 'Save these changes?' : 'Add this application?'}</h3>
          <p className="save-confirmation-copy" id="save-confirmation-copy">{application ? 'Confirm the updates to this job application.' : 'Confirm that you want to add this job application.'}</p>
          <div className="save-confirmation-summary"><strong>{submission?.companyName}</strong><span>{submission?.jobTitle}</span><span>{submission?.status} · {submission?.applicationDate}</span></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={saving}>Back to editing</Button>
            <Button onClick={() => onSubmit(submission)} disabled={saving} autoFocus>{saving ? 'Saving…' : (application ? 'Confirm changes' : 'Confirm and add')}</Button>
          </div>
        </section></div>}
      </Modal>
  );
}

export default ApplicationForm;
