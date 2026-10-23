import { Button, Modal } from './shared';
import Icon from './Icon';

export default function ApplicationDetails({ application, onClose, onEdit }) {
    const date = new Date(application.applicationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const statusColor = {
        Interview: 'text-[#137e7c]',
        Offer: 'text-[#208057]',
        Rejected: 'text-[#bd4858]',
    }[application.status] || 'text-[var(--text)]';
    return <Modal className="application-modal application-details-modal" labelledBy="application-details-title" onClose={onClose}>
        <div className="application-details-content">
            <div className="modal-heading"><div><p className="eyebrow">JOB APPLICATION</p><h2 id="application-details-title">{application.companyName}</h2><p className="details-job-title">{application.jobTitle}</p></div><button className="modal-close" type="button" aria-label="Close details" title="Close" onClick={onClose}><Icon name="close" size={16} /></button></div>
            <div className="application-details-grid grid grid-cols-2 gap-[10px] max-[480px]:grid-cols-1">
                <div className="application-detail"><span>Status</span><strong className={statusColor}>{application.status === 'Interview' ? 'Interviewing' : application.status}</strong></div>
                <div className="application-detail"><span>Application date</span><strong>{date}</strong></div>
                {application.salary && <div className="application-detail"><span>Salary</span><strong>{application.salary}</strong></div>}
                {application.location && <div className="application-detail"><span>Location</span><strong>{application.location}</strong></div>}
            </div>
            <section className="application-details-notes"><h3>Notes</h3><p>{application.notes?.trim() || 'No notes added.'}</p></section>
        </div>
        <div className="form-actions"><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={() => onEdit(application)}><Icon name="pencil" size={15} /> Edit application</Button></div>
    </Modal>;
}

