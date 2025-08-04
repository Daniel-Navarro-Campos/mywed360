import React from 'react';
function Progress({ value, max=100, variant='primary', className = '' }) {
  const getColor = () => {
    switch(variant) {
      case 'success': return 'bg-pastel-green';
      case 'primary': return 'bg-pastel-blue';
      case 'destructive': return 'bg-pastel-pink';
      default: return 'bg-gray-300';
    }
  };
  return (
    <div className={`group cursor-pointer w-full bg-gray-200 rounded-full overflow-visible ${className}`}>
      <div className={`${getColor()} transition-transform duration-200 ease-in-out transform origin-bottom group-hover:scale-y-110`} style={{ width: `${(value/max)*100}%`, height: '100%' }} />
    </div>
  );
}

export { Progress };
export default Progress;