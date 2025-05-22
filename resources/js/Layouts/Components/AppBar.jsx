import { styled } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';

// Customizable drawer width
const drawerWidth = 260;

/**
 * Enhanced AppBar component with improved transitions, animations, and responsive behavior
 *
 * This component provides:
 * - Smooth transitions when drawer opens/closes
 * - Responsive behavior for different screen sizes
 * - Subtle elevation and backdrop filter effects
 * - Proper z-index management
 */
const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => !['open', 'compact', 'transparent', 'elevation'].includes(prop),
})(({ theme, open, compact = false, transparent = false, elevation = true }) => ({
    zIndex: theme.zIndex.drawer + 1,
    '@media print': {
        display: 'none !important',
    },
    transition: theme.transitions.create(['width', 'margin', 'background-color', 'box-shadow'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.standard,
    }),
    padding: compact ? '0 8px' : '0 16px',
    boxShadow: elevation ? (
        theme.palette.mode === 'dark'
            ? '0 2px 10px rgba(0, 0, 0, 0.5)'
            : '0 1px 8px rgba(0, 0, 0, 0.1)'
    ) : 'none',
    backgroundColor: transparent
        ? 'rgba(255, 255, 255, 0.7)'
        : theme.palette.background.paper,
    backdropFilter: transparent ? 'blur(10px)' : 'none',
    color: theme.palette.text.primary,
    borderBottom: theme.palette.mode === 'dark'
        ? '1px solid rgba(255, 255, 255, 0.05)'
        : '1px solid rgba(0, 0, 0, 0.05)',

    // Enhanced desktop view when drawer is open
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin', 'background-color', 'box-shadow'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),

    // Responsive adjustments for different screen sizes
    [theme.breakpoints.down('sm')]: {
        width: '100%',
        marginLeft: 0,
        padding: '0 8px',
        ...(open && {
            width: '100%',
            marginLeft: 0,
        }),
    },

    // Optional glass effect for modern UIs
    ...(transparent && {
        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: 'blur(10px)',
            backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(18, 18, 18, 0.7)'
                : 'rgba(255, 255, 255, 0.7)',
            zIndex: -1,
        },
    }),

    // Tablet view adjustments
    [theme.breakpoints.between('sm', 'md')]: {
        ...(open && {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: drawerWidth,
        }),
    },

    // Animation for compact/expanded modes
    ...(compact && {
        height: 48,
        minHeight: 48,
        '& .MuiToolbar-root': {
            minHeight: 48,
            paddingLeft: theme.spacing(1),
            paddingRight: theme.spacing(1),
        },
        '& .MuiTypography-root': {
            fontSize: '0.9rem',
        },
    }),

    // Default expanded mode
    ...(!compact && {
        height: 64,
        minHeight: 64,
        '& .MuiToolbar-root': {
            minHeight: 64,
        },
    }),

    // Smooth scroll behavior
    position: 'fixed',
    top: 0,
}));

export default AppBar;

// Export the drawer width for consistency across components
export { drawerWidth };
