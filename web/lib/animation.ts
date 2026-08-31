export function staggerDelay(index: number, step = 40): React.CSSProperties {
  return {
    animationDelay: `${index * step}ms`,
    animationFillMode: "backwards",
  };
}
