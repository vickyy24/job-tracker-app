import { useEffect, useState } from 'react';
import Button from '../components/shared/Button';
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

    return (
        <section className="page-content settings-page min-w-0">
            <div className="page-heading max-[480px]:items-start max-[480px]:gap-2">
                <h1 className="max-[480px]:text-[22px]">Settings</h1>
            </div>

            <form className="settings-card max-[480px]:p-[14px]" onSubmit={saveWorkspace}>
                <h2>Workspace</h2>
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
                <div className="form-actions">
                    <Button type="submit" disabled={workspaceDraft.trim() === workspace}>
                        Save workspace
                    </Button>
                </div>
            </form>

            <form className="settings-card max-[480px]:p-[14px]" onSubmit={saveDailyGoal}>
                <h2>Daily goal</h2>
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
                        {dailyGoalError || 'Counts applications created today using UTC.'}
                    </small>
                </label>
                <div className="form-actions">
                    <Button type="submit" disabled={Boolean(dailyGoalError) || Number(dailyGoalDraft) === dailyGoal}>
                        Save daily goal
                    </Button>
                </div>
            </form>

            <section className="settings-card max-[480px]:p-[14px]">
                <h2>Appearance</h2>
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
            </section>
        </section>
    );
}
