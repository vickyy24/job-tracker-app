import { Button } from '../components/shared';
import Icon from '../components/Icon';

export default function AssetsPage({ onBoard }) {
    return <section className="page-content min-w-0"><div className="page-heading max-[480px]:items-start max-[480px]:gap-2"><div><p className="eyebrow">JOB SEARCH MATERIALS</p><h1 className="max-[480px]:text-[22px]">Assets</h1><p>A place for the resources that support your job applications.</p></div></div><div className="feature-empty"><span className="feature-icon"><Icon name="assets" size={22} /></span><h2>What you’ll use Assets for</h2><p>Keep your resume, cover letters, portfolio links, and other job-search materials organized alongside your applications. This page currently explains the feature; saving or uploading files isn’t available yet.</p><Button variant="secondary" onClick={onBoard}>Go to board</Button></div></section>;
}

