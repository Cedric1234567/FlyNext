// interface ModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     children: ReactNode;
//     title?: string;
//     className?: string;
//     closeOnOutsideClick?: boolean;
// }

// const Modal = ({
//     isOpen,
//     onClose,
//     children,
//     title,
//     className = '',
//     closeOnOutsideClick = true,
// }: ModalProps) => {
//     const modalRef = useRef<HTMLDivElement>(null);
    
//     // Close on ESC key press
//     useEffect(() => {
//         const handleKeyDown = (event: KeyboardEvent) => {
//             if (event.key === 'Escape') {
//                 onClose();
//             }
//         };
        
//         if (isOpen) {
//             document.addEventListener('keydown', handleKeyDown);
//             // Prevent body scrolling when modal is open
//             document.body.style.overflow = 'hidden';
//         }
        
//         return () => {
//             document.removeEventListener('keydown', handleKeyDown);
//             document.body.style.overflow = '';
//         };
//     }, [isOpen, onClose]);
    
//     // Close on outside click
//     useEffect(() => {
//         const handleOutsideClick = (event: MouseEvent) => {
//             if (
//                 closeOnOutsideClick &&
//                 modalRef.current &&
//                 !modalRef.current.contains(event.target as Node)
//             ) {
//                 onClose();
//             }
//         };
        
//         if (isOpen) {
//             document.addEventListener('mousedown', handleOutsideClick);
//         }
        
//         return () => {
//             document.removeEventListener('mousedown', handleOutsideClick);
//         };
//     }, [isOpen, onClose, closeOnOutsideClick]);
    
//     if (!isOpen) return null;
    