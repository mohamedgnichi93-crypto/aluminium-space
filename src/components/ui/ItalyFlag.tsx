const ItalyFlag = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={Math.round(size * 0.67)}
    viewBox="0 0 30 20"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2 }}
  >
    <rect width="10" height="20" fill="#009246" />
    <rect x="10" width="10" height="20" fill="#FFFFFF" />
    <rect x="20" width="10" height="20" fill="#CE2B37" />
  </svg>
);

export default ItalyFlag;
