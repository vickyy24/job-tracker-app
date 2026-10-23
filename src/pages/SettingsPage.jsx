import { useEffect, useState } from 'react';
import Button from '../components/shared/Button';
import Icon from '../components/Icon';
import ThemeModeIcon from '../components/ThemeModeIcon';

export default function SettingsPage({
    workspace,
    onWorkspaceChange,
    dailyGoal,
    onDailyGoalChange,
    themeMode,
    onThemeChange,
}) {
    const [workspaceDraft, setWorkspaceDraft] = useState(workspace);
    const [workspaceError, setWorkspaceError] = useState('');
    const [dailyGoalDraft, setDailyGoalDraft] = useState(String(dailyGoal));
    const [dailyGoalError, setDailyGoalError] = useState('');

    useEffect(() => {
        setWorkspaceDraft(workspace);
    }, [workspace]);

    useEffect(() => {
        setDailyGoalDraft(String(dailyGoal));
    }, [dailyGoal]);

    const saveWorkspace = (event) => {
        event.preventDefault();
        const nextWorkspace = workspaceDraft.trim();

        if (!nextWorkspace) {
            setWorkspaceError('Enter a workspace title.');
            return;
        }

        onWorkspaceChange(nextWorkspace);
        setWorkspaceError('');
    };

    const handleDailyGoalChange = (event) => {
        const value = event.target.value;
        setDailyGoalDraft(value);

        if (!value) {
            setDailyGoalError('Enter a daily goal from 1 to 100.');
            return;
        }

        const parsedGoal = Number(value);
        if (!Number.isInteger(parsedGoal) || parsedGoal < 1 || parsedGoal > 100) {
            setDailyGoalError('Enter a whole number from 1 to 100.');
            return;
        }

        setDailyGoalError('');
    };

    const saveDailyGoal = (event) => {
        event.preventDefault();
        const parsedGoal = Number(dailyGoalDraft);

        if (!Number.isInteger(parsedGoal) || parsedGoal < 1 || parsedGoal > 100) {
            setDailyGoalError('Enter a whole number from 1 to 100.');
            return;
        }

        onDailyGoalChange(parsedGoal);
        setDailyGoalError('');
    };

    const workspaceChanged = workspaceDraft.trim() !== workspace;
    const dailyGoalChanged = Number(dailyGoalDraft) !== dailyGoal;
    const dailyGoalValid = Number.isInteger(Number(dailyGoalDraft))
        && Number(dailyGoalDraft) >= 1
        && Number(dailyGoalDraft) <= 100;

    return (
        <section className="page-content settings-page min-w-0">
            <div className="page-heading settings-heading">
                <h1>Settings</h1>
            </div>

            <form className="settings-card" onSubmit={saveWorkspace}>
                <div className="settings-description">
                    <h2>Workspace</h2>
                    <p>Set the name displayed in your workspace.</p>
                </div>
                <div className="settings-controls">
                    <label className="settings-field" htmlFor="workspace-title">
                        Workspace title
                        <input
                            id="workspace-title"
                            value={workspaceDraft}
                            maxLength={50}
                            onChange={(event) => {
                                setWorkspaceDraft(event.target.value);
                                setWorkspaceError('');
                            }}
                            aria-invalid={Boolean(workspaceError)}
                            aria-describedby={workspaceError ? 'workspace-title-error' : undefined}
                        />
                        {workspaceError && <small id="workspace-title-error" role="alert">{workspaceError}</small>}
                    </label>
                    {workspaceChanged
                        ? <Button type="submit">Save</Button>
                        : <span className="settings-saved" role="status"><Icon name="check" size={14} /> Saved</span>}
                </div>
            </form>

            <form className="settings-card" onSubmit={saveDailyGoal}>
                <div className="settings-description">
                    <h2>Daily goal</h2>
                    <p>Choose how many applications you want to submit each day.</p>
                </div>
                <div className="settings-controls">
                    <label className="settings-field" htmlFor="daily-application-goal">
                        Applications per day
                        <input
                            id="daily-application-goal"
                            type="number"
                            min="1"
                            max="100"
                            step="1"
                            value={dailyGoalDraft}
                            aria-invalid={Boolean(dailyGoalError)}
                            aria-describedby="daily-goal-help"
                            onChange={handleDailyGoalChange}
                        />
                        <small id="daily-goal-help" role={dailyGoalError ? 'alert' : undefined}>
                            {dailyGoalError || 'Your progress resets daily using UTC.'}
                        </small>
                    </label>
                    {dailyGoalChanged && dailyGoalValid
                        ? <Button type="submit">Save</Button>
                        : !dailyGoalError && <span className="settings-saved" role="status"><Icon name="check" size={14} /> Saved</span>}
                </div>
            </form>

            <section className="settings-card">
                <div className="settings-description">
                    <h2>Appearance</h2>
                    <p>Choose the theme used across the app.</p>
                </div>
                <div className="settings-controls">
                    <div className="appearance-options" role="group" aria-label="Choose appearance">
                        <button
                            className={themeMode === 'light' ? 'chosen' : ''}
                            type="button"
                            aria-pressed={themeMode === 'light'}
                            onClick={() => onThemeChange('light')}
                        >
                            <ThemeModeIcon mode="sun" />
                            <span>Light</span>
                        </button>
                        <button
                            className={themeMode === 'dark' ? 'chosen' : ''}
                            type="button"
                            aria-pressed={themeMode === 'dark'}
                            onClick={() => onThemeChange('dark')}
                        >
                            <ThemeModeIcon mode="moon" />
                            <span>Dark</span>
                        </button>
                    </div>
                    <span className="settings-saved" role="status"><Icon name="check" size={14} /> Saved</span>
                </div>
            </section>
        </section>
    );
}
