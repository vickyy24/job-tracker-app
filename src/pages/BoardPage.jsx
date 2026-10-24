import Icon from '../components/Icon';
import KanbanBoard from '../components/KanbanBoard';
import { ApplicationList } from '../components/ApplicationList';

export default function BoardPage({
    applications,
    loading,
    error,
    search,
    onSearchChange,
    status,
    sortBy,
    onSortByChange,
    viewMode,
    onViewModeChange,
    onClearFilters,
    onRetry,
    onSelect,
    onAdd,
    onFilterStatus,
    onStatusUpdate,
    onDelete,
    onEdit,
    pendingStatusIds,
    statusErrors,
}) {
    const hasFilters = Boolean(search.trim() || status);

    return <>
        <div className="board-toolbar flex min-h-[34px] items-center gap-2 mb-[10px] max-[900px]:min-[761px]:flex-wrap max-[760px]:grid max-[760px]:grid-cols-[minmax(0,1fr)_100px_60px] max-[760px]:gap-[6px] max-[760px]:relative max-[760px]:mb-[9px] max-[760px]:min-w-0" aria-label="Search and board controls">
            <label className="search-control min-[901px]:[--board-search-width:360px] max-[900px]:min-[761px]:flex-[1_1_250px] max-[760px]:col-span-1 max-[760px]:h-[30px] max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:gap-1 max-[760px]:px-[6px]">
                <Icon className="max-[760px]:size-3 max-[760px]:min-w-3" name="search" size={16} />
                <input className="max-[760px]:min-w-0 max-[760px]:text-[9px]" type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search company or job title…" aria-label="Search by company or job title" />
            </label>
            <div className="toolbar-spacer max-[900px]:min-[761px]:hidden max-[760px]:hidden" />
            <label className="sort-control max-[900px]:min-[761px]:ml-auto max-[760px]:h-[30px] max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:gap-0 max-[760px]:px-2">
                <span>Sort by</span>
                <Icon className="sort-control-chevron" name="down" size={14} />
                <select className="max-[760px]:w-full max-[760px]:min-w-0 max-[760px]:max-w-none" value={sortBy} onChange={(event) => onSortByChange(event.target.value)} aria-label="Sort by">
                    <option value="applicationDate">Application date</option>
                    <option value="createdAt">Created date</option>
                    <option value="companyName">Company name</option>
                    <option value="jobTitle">Job title</option>
                </select>
            </label>
            <div className="view-toggle flex h-[34px] items-center p-[3px] max-[760px]:h-[30px] max-[760px]:w-[60px] max-[760px]:min-w-0 max-[760px]:justify-center max-[760px]:p-0.5" role="group" aria-label="View mode">
                <button className={`${viewMode === 'board' ? 'active' : ''} max-[760px]:h-6 max-[760px]:w-7`} onClick={() => onViewModeChange('board')} aria-label="Board view"><Icon name="grid" size={16} /></button>
                <button className={`${viewMode === 'list' ? 'active' : ''} max-[760px]:h-6 max-[760px]:w-7`} onClick={() => onViewModeChange('list')} aria-label="List view"><Icon name="list" size={16} /></button>
            </div>
            {hasFilters && <button className="clear-filters-button max-[760px]:absolute max-[760px]:top-[calc(100%+1px)] max-[760px]:right-0 max-[760px]:px-1 max-[760px]:py-[2px] max-[760px]:text-[9px]" onClick={onClearFilters}>Clear</button>}
        </div>
        {viewMode === 'board'
            ? <KanbanBoard
                applications={applications}
                loading={loading}
                error={error}
                onRetry={onRetry}
                noResults={hasFilters && applications.length === 0 && !error}
                onClearFilters={onClearFilters}
                onSelectApplication={onSelect}
                onAddApplication={onAdd}
                onFilterStatus={onFilterStatus}
                onStatusChange={onStatusUpdate}
                onDeleteApplication={onDelete}
                pendingStatusIds={pendingStatusIds}
                statusErrors={statusErrors}
            />
            : <ApplicationList
                applications={applications}
                loading={loading}
                error={error}
                onRetry={onRetry}
                onSelect={onSelect}
                onEdit={onEdit}
            />}
    </>;
}
