import {
    BriefcaseBusiness,
    CalendarDays,
    Check,
    ChartNoAxesColumnIncreasing,
    ChevronDown,
    Columns3,
    Grid2X2,
    List,
    LogOut,
    MapPin,
    Monitor,
    Moon,
    CircleX,
    FileCheck2,
    Trophy,
    UsersRound,
    PanelLeftClose,
    PanelLeftOpen,
    Pencil,
    Search,
    Settings,
    Sun,
    Target,
    X,
} from 'lucide-react';

const icons = {
    board: Columns3,
    stats: ChartNoAxesColumnIncreasing,
    assets: BriefcaseBusiness,
    settings: Settings,
    logout: LogOut,
    search: Search,
    calendar: CalendarDays,
    check: Check,
    sun: Sun,
    moon: Moon,
    pencil: Pencil,
    goal: Target,
    list: List,
    grid: Grid2X2,
    mapPin: MapPin,
    down: ChevronDown,
    close: X,
    collapse: PanelLeftClose,
    expand: PanelLeftOpen,
    monitor: Monitor,
    interviews: UsersRound,
    offer: Trophy,
    rejected: CircleX,
    applied: FileCheck2,
};

function Icon({ name, size = 18, className }) {
    const IconComponent = icons[name];

    if (!IconComponent) return null;

    return <IconComponent className={className} size={size} strokeWidth={1.8} aria-hidden="true" />;
}

export default Icon;
