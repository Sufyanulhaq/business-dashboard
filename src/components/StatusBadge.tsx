import type { Status } from "@/lib/types";

export const StatusBadge = ({ status }: { status: Status }) => <span className={`badge ${status}`}>{status}</span>;
