// 24×24 stroke icons, drawn with currentColor

const Icon = ({ d }: { d: string }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

const circle = 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0';

export const PlusCircleIcon = () => <Icon d={circle + 'M12 8v8M8 12h8'} />;
export const MinusCircleIcon = () => <Icon d={circle + 'M8 12h8'} />;
export const CheckCircleIcon = () => <Icon d={circle + 'M8 12l3 3 5-6'} />;
export const CloseIcon = () => <Icon d="M6 6l12 12M18 6 6 18" />;
export const PlusIcon = () => <Icon d="M12 5v14M5 12h14" />;
export const ChevronIcon = () => <Icon d="m6 9 6 6 6-6" />;
export const TrashIcon = () => (
  <Icon d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" />
);
export const GripIcon = () => (
  <Icon d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" />
);
