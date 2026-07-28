export default function HuflitLogo({ width = 120, height = 'auto', className = '', style = {} }) {
  return (
    <img 
      src="/huflit-logo.png" 
      alt="Logo HUFLIT - Trường Đại học Ngoại ngữ - Tin học TP. Hồ Chí Minh" 
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width, 
        height: typeof height === 'number' ? `${height}px` : height, 
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style 
      }}
      className={className}
    />
  );
}
