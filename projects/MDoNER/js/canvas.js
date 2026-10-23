/* Signature: animated topographic contour field in hero, theme-aware */
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('contour-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr;

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function heightAt(x, y, t){
    return Math.sin(x*0.006 + t*0.05) * Math.cos(y*0.007 - t*0.03) * 0.5
         + Math.sin((x+y)*0.004 + t*0.02) * 0.5;
  }

  const levels = 9;
  const riskNode = { x: 0.62, y: 0.42 };

  function accentRgb(){
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim();
    return raw || '210,162,39';
  }

  function draw(t){
    ctx.clearRect(0,0,w,h);
    ctx.lineWidth = 1;
    const step = 6;
    const rgb = accentRgb();
    for(let li=0; li<levels; li++){
      const target = (li/(levels-1))*2 - 1;
      const dist = li / levels;
      ctx.strokeStyle = `rgba(${rgb},${0.10 + (1-dist)*0.10})`;
      ctx.beginPath();
      for(let x=0; x<=w; x+=step){
        for(let y=0; y<=h; y+=step){
          const v = heightAt(x,y,t);
          if(Math.abs(v-target) < 0.03){
            ctx.moveTo(x, y);
            ctx.lineTo(x+step, y);
          }
        }
      }
      ctx.stroke();
    }
    const rx = w*riskNode.x, ry = h*riskNode.y;
    const pulse = (Math.sin(t*0.08)+1)/2;
    const grad = ctx.createRadialGradient(rx,ry,0,rx,ry,90+pulse*20);
    grad.addColorStop(0, 'rgba(176,71,43,0.35)');
    grad.addColorStop(1, 'rgba(176,71,43,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(rx, ry, 90+pulse*20, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#B0472B';
    ctx.beginPath();
    ctx.arc(rx, ry, 3.5, 0, Math.PI*2);
    ctx.fill();
  }

  let frame = 0;
  function loop(){
    frame += 1;
    draw(frame);
    if(!prefersReduced) requestAnimationFrame(loop);
  }
  if(prefersReduced){ draw(0); } else { loop(); }
});
