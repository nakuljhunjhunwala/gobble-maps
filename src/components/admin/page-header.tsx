import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  sub?: ReactNode;
  /** Right-hand slot (segmented control, primary action, …). */
  children?: ReactNode;
}

export function PageHeader({ title, sub, children }: PageHeaderProps) {
  return (
    <div className="ad-pagehead">
      <div>
        <h2 className="ad-h2">{title}</h2>
        {sub && <p className="ad-sub">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
