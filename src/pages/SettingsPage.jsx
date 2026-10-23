import { useEffect, useState } from 'react';

export default function SettingsPage({ workspace, onWorkspaceChange, dailyGoal, onDailyGoalChange }) {
    const [dailyGoalDraft, setDailyGoalDraft] = useState(String(dailyGoal));
    const [dailyGoalError, setDailyGoalError] = useState('');
    useEffect(() => { setDailyGoalDraft(String(dailyGoal)); }, [dailyGoal]);
    const handleDailyGoalChange = (event) => {
        const value = event.target.value;
        setDailyGoalDraft(value);
        if (value === '') {
            setDailyGoalError('');
            return;
        }
        const parsed = Number(value);
        if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 100) {
            onDailyGoalChange(parsed);
            setDailyGoalError('');
        } else {
            setDailyGoalError('Enter a whole number from 1 to 100.');
        }
    };
    return <section className="page-content settings-page min-w-0"><div className="page-heading max-[480px]:items-start max-[480px]:gap-2"><div><p className="eyebrow">PREFERENCES</p><h1 className="max-[480px]:text-[22px]">Settings</h1><p>Personalize your job-tracking workspace.</p></div></div>
        <section className="settings-card max-[480px]:p-[14px]"><h2>Workspace</h2><label className="settings-field">Workspace title<input value={workspace} maxLength={50} onChange={(event) => onWorkspaceChange(event.target.value || 'Job Tracker')} /></label></section>
        <section className="settings-card max-[480px]:p-[14px]"><h2>Daily goal</h2><label className="settings-field">Applications per day<input type="number" min="1" max="100" step="1" value={dailyGoalDraft} aria-invalid={Boolean(dailyGoalError)} aria-describedby="daily-goal-help" onChange={handleDailyGoalChange} /><small id="daily-goal-help">{dailyGoalError || 'Counts applications created today using UTC. Your goal is saved in this browser.'}</small></label></section>
    </section>;
}

