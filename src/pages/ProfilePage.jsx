import { useEffect, useState } from 'react';
import Button from '../components/shared/Button';
import Icon from '../components/Icon';
import { apiRequest } from '../services/apiClient';

function profileDraftFromUser(user) {
    return {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        gender: user?.gender || '',
        avatar: user?.avatar || '',
    };
}

export default function ProfilePage({ user, onUserUpdated }) {
    const [draft, setDraft] = useState(() => profileDraftFromUser(user));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const email = user?.email || user?.username || '';
    const displayName = [draft.firstName, draft.lastName].filter(Boolean).join(' ').trim() || 'Your profile';

    useEffect(() => {
        setDraft(profileDraftFromUser(user));
    }, [user]);

    const changePhoto = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Choose an image file.');
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            setError('Choose an image smaller than 8 MB.');
            return;
        }

        let bitmap;
        try {
            bitmap = await createImageBitmap(file);
            let scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Could not prepare this image.');

            let avatar = '';
            for (let attempt = 0; attempt < 6; attempt += 1) {
                canvas.width = Math.max(1, Math.round(bitmap.width * scale));
                canvas.height = Math.max(1, Math.round(bitmap.height * scale));
                context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                avatar = canvas.toDataURL('image/jpeg', .76 - attempt * .08);
                if (avatar.length <= 28000) break;
                scale *= .8;
            }

            if (avatar.length > 28000) {
                setError('Choose a simpler or smaller image.');
                return;
            }

            setDraft((current) => ({ ...current, avatar }));
            setError('');
            setSaved(false);
        } catch {
            setError('This image could not be opened. Try another file.');
        } finally {
            bitmap?.close();
        }
    };

    const saveProfile = async (event) => {
        event.preventDefault();
        const firstName = draft.firstName.trim();
        const lastName = draft.lastName.trim();
        if (!firstName) {
            setError('Enter your first name.');
            return;
        }
        if (firstName.length > 80 || lastName.length > 80) {
            setError('Names must be 80 characters or fewer.');
            return;
        }

        setSaving(true);
        setError('');
        setSaved(false);
        try {
            const result = await apiRequest('/auth/profile', {
                method: 'PATCH',
                body: JSON.stringify({
                    firstName,
                    lastName,
                    gender: draft.gender,
                    avatar: draft.avatar,
                }),
            }, { retryAfterRefresh: true });
            onUserUpdated(result.user);
            setSaved(true);
        } catch (saveError) {
            setError(saveError.message || 'Could not save your profile. Try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="page-content settings-page profile-page min-w-0 max-[760px]:w-full">
            <div className="page-heading profile-page-heading">
                <div className="profile-page-heading-title">
                    <div>
                        <h1>Profile</h1>
                        <p>Manage your personal information and account photo.</p>
                    </div>
                </div>
            </div>

            <div className="profile-page-layout grid grid-cols-[minmax(220px,.72fr)_minmax(0,1.5fr)] max-[760px]:grid-cols-1">
                <section className="profile-identity-card" aria-label="Profile overview">
                    {draft.avatar
                        ? <img className="profile-page-avatar" src={draft.avatar} alt={`${displayName} profile`} />
                        : <span className="profile-page-avatar profile-page-avatar-placeholder"><Icon name="user" size={34} /></span>}
                    <h2>{displayName}</h2>
                    <p className="profile-page-email">{email}</p>
                    <div className="profile-page-photo-actions">
                        <label className="profile-page-photo-button">
                            <Icon name="camera" size={15} />
                            Change photo
                            <input type="file" accept="image/*" onChange={changePhoto} disabled={saving} />
                        </label>
                        {draft.avatar && <button className="profile-page-remove-photo" type="button" onClick={() => { setDraft((current) => ({ ...current, avatar: '' })); setSaved(false); }} disabled={saving}>Remove photo</button>}
                    </div>
                </section>

                <form className="profile-information-card" onSubmit={saveProfile}>
                    <div className="profile-information-heading">
                        <h2>Personal information</h2>
                        <p>Update the details shown on your account.</p>
                    </div>
                    <div className="profile-information-fields">
                        <label className="profile-page-field">
                            First name
                            <input autoComplete="given-name" value={draft.firstName} maxLength={80} onChange={(event) => { setDraft((current) => ({ ...current, firstName: event.target.value })); setError(''); setSaved(false); }} />
                        </label>
                        <label className="profile-page-field">
                            Last name
                            <input autoComplete="family-name" value={draft.lastName} maxLength={80} onChange={(event) => { setDraft((current) => ({ ...current, lastName: event.target.value })); setError(''); setSaved(false); }} />
                        </label>
                        <label className="profile-page-field profile-page-field-full">
                            Email address
                            <input type="email" value={email} readOnly />
                        </label>
                        <label className="profile-page-field profile-page-field-full">
                            Gender
                            <select required value={draft.gender} onChange={(event) => { setDraft((current) => ({ ...current, gender: event.target.value })); setError(''); setSaved(false); }}>
                                <option value="" disabled>Select gender</option>
                                <option value="woman">Woman</option>
                                <option value="man">Man</option>
                                <option value="non-binary">Non-binary</option>
                                <option value="other">Other</option>
                            </select>
                        </label>
                    </div>
                    {error && <p className="profile-page-error" role="alert">{error}</p>}
                    <div className="profile-information-actions">
                        {saved && <span className="profile-page-saved" role="status"><Icon name="check" size={14} /> Changes saved</span>}
                        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
                    </div>
                </form>
            </div>
        </section>
    );
}
