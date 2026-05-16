const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["VisualEditorPane-irw6eFLg.js","main-ikNWcg-Y.js","main-YGwNF6lO.css","Alert-yDbDimGi.js","index-Bql7Qsc6.js","VisualEditorPane-DsqAEUjJ.css"])))=>i.map(i=>d[i]);
import{r as l,j as e,B as N,u as R,b as q,i as B,c as F,d as k,_ as U}from"./main-ikNWcg-Y.js";import{A as Q}from"./Alert-yDbDimGi.js";import{C as J,B as H}from"./index-Bql7Qsc6.js";import{S as G}from"./SegmentedControl-Di9tM_yn.js";function X({entries:a,currentPath:s,dirty:t,onSelect:d}){const i=l.useMemo(()=>Z(a||[]),[a]),[o,f]=l.useState(()=>Y(a||[]));function c(p){f(h=>{const x=new Set(h);return x.has(p)?x.delete(p):x.add(p),x})}return e.jsxs("div",{className:"flex h-full min-w-0 flex-col overflow-y-auto border-r border-zinc-200 bg-white",children:[e.jsx("header",{className:"border-b border-zinc-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500",children:"Active theme"}),e.jsx("ul",{role:"tree",className:"flex-1 py-1 text-[13px]",children:i.map(p=>e.jsx(M,{node:p,depth:0,open:o,currentPath:s,dirty:t,onToggle:c,onSelect:d},p.path))})]})}function M({node:a,depth:s,open:t,currentPath:d,dirty:i,onToggle:o,onSelect:f}){const c=t.has(a.path),p=a.type==="file"&&a.path===d,h=i==null?void 0:i.has(a.path),x={paddingLeft:8+s*12};return a.type==="dir"?e.jsxs("li",{role:"treeitem","aria-expanded":c,children:[e.jsxs("button",{type:"button",onClick:()=>o(a.path),className:"flex w-full items-center gap-1 py-1 pr-2 text-left text-zinc-700 hover:bg-zinc-50",style:x,children:[e.jsx("span",{"aria-hidden":"true",className:"inline-block w-3 text-zinc-400",children:c?"▾":"▸"}),e.jsxs("span",{className:"truncate font-medium",children:[a.name,"/"]})]}),c&&e.jsx("ul",{role:"group",children:a.children.map(y=>e.jsx(M,{node:y,depth:s+1,open:t,currentPath:d,dirty:i,onToggle:o,onSelect:f},y.path))})]}):e.jsx("li",{role:"treeitem",children:e.jsxs("button",{type:"button",onClick:()=>f(a.path),className:`flex w-full items-center gap-2 py-1 pr-2 text-left font-mono text-[12px] ${p?"bg-zinc-900 text-white":"text-zinc-700 hover:bg-zinc-50"}`,style:x,"aria-current":p?"true":void 0,children:[e.jsx("span",{className:"truncate",children:a.name}),h&&e.jsx("span",{"aria-label":"Unsaved changes",className:`inline-block h-1.5 w-1.5 rounded-full ${p?"bg-amber-300":"bg-amber-500"}`})]})})}function Z(a){const s=new Map;for(const t of a){const d=t.path.split("/");let i=s,o="";for(let f=0;f<d.length;f++){const c=d[f];o=o?o+"/"+c:c;const p=f===d.length-1;let h=i.get(c);h||(h={name:c,path:o,type:p?t.type:"dir",children:new Map},i.set(c,h)),i=h.children}}return K(s)}function K(a){const s=Array.from(a.values()).map(t=>({...t,children:t.type==="dir"?K(t.children):void 0}));return s.sort((t,d)=>t.type!==d.type?t.type==="dir"?-1:1:t.name.localeCompare(d.name)),s}function Y(a){const s=new Set;for(const t of a)t.type==="dir"&&!t.path.includes("/")&&s.add(t.path);return s}const ee=[{label:"Header partial",body:"{{ partial('header', { page_title: meta.title|default('Page') }) }}"},{label:"Footer partial",body:"{{ partial('footer') }}"},{label:"SEO head",body:"{{ seo_head()|raw }}"},{label:"Post body",body:`<article>
  <h1>{{ meta.title|default('') }}</h1>
  {% if meta.date %}<p><time>{{ meta.date }}</time></p>{% endif %}
  {{ html|raw }}
</article>`},{label:"Archive list",body:`{% if posts is iterable and posts|length %}
  <ul class="archive-list">
    {% for post in posts %}
      <li>
        <a href="{{ post.url }}">{{ post.title }}</a>
        {% if post.date %}<time>{{ post.date }}</time>{% endif %}
      </li>
    {% endfor %}
  </ul>
{% else %}
  <p>No posts yet.</p>
{% endif %}`},{label:"Pagination",body:"{{ paginate(page|default(1), total_pages|default(1), '/' ~ folder)|raw }}"},{label:"Featured image",body:`{% set featured = meta.image is iterable ? (meta.image|first) : meta.image %}
{% if featured %}
  <figure><img src="{{ featured }}" alt="{{ meta.title|default('') }}"></figure>
{% endif %}`},{label:"Taxonomy tag list",body:`{% if meta.tags %}
  <ul class="tags">
    {% for tag in meta.tags %}
      <li><a href="{{ slug_url(tag, 'tags') }}">{{ tag }}</a></li>
    {% endfor %}
  </ul>
{% endif %}`},{label:"Inspect helper (debug)",body:"{{ inspect(meta, 'meta')|raw }}"}],te=[{label:"Header partial",body:"<?php partial('header', ['page_title' => $meta['title'] ?? 'Page']); ?>"},{label:"Footer partial",body:"<?php partial('footer'); ?>"},{label:"SEO head",body:"<?= seo_head() ?>"},{label:"Post body",body:`<article>
  <h1><?= e($meta['title'] ?? '') ?></h1>
  <?php if (!empty($meta['date'])): ?>
    <p><time><?= e($meta['date']) ?></time></p>
  <?php endif; ?>
  <?= $html ?>
</article>`},{label:"Archive list",body:`<?php if (!empty($posts)): ?>
  <ul class="archive-list">
    <?php foreach ($posts as $post): ?>
      <li>
        <a href="<?= e($post['url']) ?>"><?= e($post['title']) ?></a>
        <?php if (!empty($post['date'])): ?>
          <time><?= e($post['date']) ?></time>
        <?php endif; ?>
      </li>
    <?php endforeach; ?>
  </ul>
<?php else: ?>
  <p>No posts yet.</p>
<?php endif; ?>`},{label:"Pagination",body:"<?= paginate((int)($page ?? 1), (int)($total_pages ?? 1), '/' . ($folder ?? '')) ?>"},{label:"Featured image",body:`<?php $featured = is_array($meta['image'] ?? null) ? ($meta['image'][0] ?? '') : ($meta['image'] ?? ''); ?>
<?php if ($featured): ?>
  <figure><img src="<?= e($featured) ?>" alt="<?= e($meta['title'] ?? '') ?>"></figure>
<?php endif; ?>`},{label:"Taxonomy tag list",body:`<?php if (!empty($meta['tags'])): ?>
  <ul class="tags">
    <?php foreach ($meta['tags'] as $tag): ?>
      <li><a href="<?= e(slug_url($tag, 'tags')) ?>"><?= e($tag) ?></a></li>
    <?php endforeach; ?>
  </ul>
<?php endif; ?>`},{label:"Inspect helper (debug)",body:"<?= inspect($meta, 'meta') ?>"}],ae=[{label:"Container",body:`.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 1.5rem;
}`},{label:"Type scale",body:`h1 { font-size: 2rem; line-height: 1.2; margin: 1.5rem 0 .75rem; }
h2 { font-size: 1.5rem; line-height: 1.25; margin: 1.25rem 0 .5rem; }
h3 { font-size: 1.25rem; line-height: 1.3; margin: 1rem 0 .5rem; }
p  { font-size: 1rem; line-height: 1.65; margin: 0 0 1rem; }`},{label:"Link reset",body:`a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
a:hover { text-decoration: none; }`},{label:"Archive list",body:`.archive-list { list-style: none; padding: 0; margin: 0; }
.archive-list li { padding: .5rem 0; border-bottom: 1px solid rgba(0,0,0,.08); }
.archive-list a { font-weight: 600; }
.archive-list time { display: block; font-size: .85em; color: #666; }`},{label:"Card",body:`.card {
  background: #fff;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(0,0,0,.05);
}`}];function se(a){return a?a.endsWith(".twig")?ee:a.endsWith(".php")?te:a.endsWith(".css")||a.endsWith(".scss")?ae:[]:[]}function ne({path:a,contents:s,loading:t,error:d,dirty:i,saving:o,saveError:f,onChange:c,onSave:p}){const[h,x]=l.useState(!1),y=l.useRef(null);l.useEffect(()=>{if(!h)return;function r(v){v.key==="Escape"&&x(!1)}function g(v){y.current&&!y.current.contains(v.target)&&x(!1)}return window.addEventListener("keydown",r),window.addEventListener("mousedown",g),()=>{window.removeEventListener("keydown",r),window.removeEventListener("mousedown",g)}},[h]),l.useEffect(()=>{function r(g){!(g.metaKey||g.ctrlKey)||g.key.toLowerCase()!=="s"||(g.preventDefault(),!o&&i&&p())}return window.addEventListener("keydown",r),()=>window.removeEventListener("keydown",r)},[o,i,p]);const m=se(a);function u(r){x(!1);const g=s.length>0&&!s.endsWith(`
`)?`

`:"";c(s+g+r+`
`)}return a?e.jsxs("div",{className:"flex h-full min-w-0 flex-col bg-white",children:[e.jsxs("header",{className:"flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2",children:[e.jsxs("div",{className:"flex items-center gap-2 truncate",children:[e.jsx("code",{className:"truncate font-mono text-[12px] text-zinc-800",children:a}),i&&e.jsx("span",{className:"rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800",children:"Unsaved"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[m.length>0&&e.jsxs("div",{ref:y,className:"relative",children:[e.jsx(N,{variant:"secondary",size:"sm",onClick:()=>x(r=>!r),"aria-haspopup":"menu","aria-expanded":h,children:"Insert ▾"}),h&&e.jsx("ul",{role:"menu",className:"absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-popover",children:m.map(r=>e.jsx("li",{children:e.jsx("button",{type:"button",role:"menuitem",onClick:()=>u(r.body),className:"block w-full px-3 py-2 text-left text-[13px] hover:bg-zinc-50",children:r.label})},r.label))})]}),e.jsx(N,{onClick:p,disabled:!i||o,children:o?"Saving…":"Save (⌘S)"})]})]}),(d||f)&&e.jsx("div",{className:"border-b border-red-100 bg-red-50 px-4 py-2",children:e.jsx(Q,{tone:"error",children:d||f})}),e.jsx("div",{className:"flex-1 min-h-0 overflow-hidden",children:t?e.jsxs("div",{className:"p-6 text-sm text-zinc-500",children:["Loading ",a,"…"]}):e.jsx(J,{value:s,onChange:c,language:re(),className:"h-full"})})]}):e.jsx("div",{className:"flex h-full items-center justify-center bg-zinc-50 text-sm text-zinc-500",children:"Pick a file on the left to start editing."})}function re(a){return"html"}const I={desktop:{width:"100%",label:"Desktop"},tablet:{width:"820px",label:"Tablet"},mobile:{width:"380px",label:"Mobile"}};function ie({version:a,onHover:s}){const t=l.useRef(null),[d,i]=l.useState("desktop"),[o,f]=l.useState("/"),[c,p]=l.useState(!1),h=`${o}${o.includes("?")?"&":"?"}__fp=${a}`;l.useEffect(()=>{function m(u){var r;u.source===((r=t.current)==null?void 0:r.contentWindow)&&(!u.data||u.data.type!=="fp-hover"||s==null||s(u.data.tag,u.data.className))}return window.addEventListener("message",m),()=>window.removeEventListener("message",m)},[s]),l.useEffect(()=>{if(!c)return;const m=t.current;if(!m)return;function u(){try{const r=m.contentDocument;if(!r||r.getElementById("__fp_hover"))return;const g=r.createElement("script");g.id="__fp_hover",g.textContent=`
          (function () {
            const style = document.createElement('style');
            style.textContent = '[data-fp-hover]{outline:2px solid #f59e0b!important;outline-offset:-2px;}';
            document.head.appendChild(style);
            let last = null;
            document.addEventListener('mouseover', function (e) {
              if (last) last.removeAttribute('data-fp-hover');
              const t = e.target;
              if (!(t instanceof Element)) return;
              t.setAttribute('data-fp-hover', '1');
              last = t;
              parent.postMessage({
                type: 'fp-hover',
                tag: t.tagName.toLowerCase(),
                className: typeof t.className === 'string' ? t.className : '',
              }, '*');
            }, true);
          })();
        `,r.body.appendChild(g)}catch{}}return u(),m.addEventListener("load",u),()=>m.removeEventListener("load",u)},[c,h]);function x(){var m;t.current&&((m=t.current.contentWindow)==null||m.location.reload())}const y=I[d]||I.desktop;return e.jsxs("div",{className:"flex h-full min-w-0 flex-col border-l border-zinc-200 bg-zinc-100",children:[e.jsxs("header",{className:"flex items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2",children:[e.jsx("input",{type:"text",value:o,onChange:m=>f(m.target.value),placeholder:"/","aria-label":"Preview URL",className:"h-8 w-44 rounded-md border border-zinc-200 px-2 font-mono text-[12px]"}),e.jsx(N,{variant:"secondary",size:"sm",onClick:x,children:"Reload"}),e.jsx(G,{ariaLabel:"Preview width",value:d,onChange:i,options:[{value:"desktop",label:"Desktop"},{value:"tablet",label:"Tablet"},{value:"mobile",label:"Mobile"}]}),e.jsxs("label",{className:"ml-auto flex cursor-pointer items-center gap-1.5 text-[12px] text-zinc-700",children:[e.jsx("input",{type:"checkbox",checked:c,onChange:m=>p(m.target.checked),className:"h-4 w-4 cursor-pointer rounded border-zinc-300"}),"Inspect"]})]}),e.jsx("div",{className:"flex-1 overflow-auto p-4",children:e.jsx("div",{className:"mx-auto h-full bg-white shadow-card transition-[width] duration-200",style:{width:y.width,maxWidth:"100%"},children:e.jsx("iframe",{ref:t,title:"Theme preview",src:h,className:"block h-full w-full",sandbox:"allow-same-origin allow-scripts allow-forms allow-popups"})})})]})}const le=l.lazy(()=>U(()=>import("./VisualEditorPane-irw6eFLg.js"),__vite__mapDeps([0,1,2,3,4,5]))),$=".fp.json";function fe(){var E,_,L,P,T,A,O,W;const a=R(),s=q(),[t,d]=l.useState(""),[i,o]=l.useState({}),[f,c]=l.useState({}),[p,h]=l.useState(()=>Date.now()),[x,y]=l.useState(null),m=B({queryKey:["theme-tree"],queryFn:()=>k.get("/theme/tree")});l.useEffect(()=>{var j;if(t)return;const n=(((j=m.data)==null?void 0:j.entries)||[]).filter(w=>w.type==="file");if(!n.length)return;const b=n.find(w=>w.path==="templates/post.twig"||w.path==="templates/post.php");d((b||n[0]).path)},[m.data,t]);const u=B({queryKey:["theme-file",t],queryFn:()=>k.get(`/theme/file?path=${encodeURIComponent(t)}`),enabled:!!t});l.useEffect(()=>{!u.data||!t||(o(n=>n[t]!==void 0?n:{...n,[t]:u.data.contents}),c(n=>({...n,[t]:u.data.contents})))},[u.data,t]);const r=F({mutationFn:()=>k.put("/theme/file",{path:t,contents:i[t]??""}),onSuccess:()=>{c(n=>({...n,[t]:i[t]})),h(Date.now()),a.invalidateQueries({queryKey:["theme-tree"]}),s.show(`Saved ${t}.`,{duration:1800})},onError:n=>s.show(n.message||"Couldn't save.",{tone:"error"})}),g=F({mutationFn:async()=>{const n=window.prompt("Name for visual template (e.g. hero, landing, _cta):");if(!n)return null;const b=n.trim().replace(/[^A-Za-z0-9._-]/g,"");if(!b)throw new Error("Invalid name.");const j=`templates/${b}${b.endsWith($)?"":$}`,w=JSON.stringify({blocks:[]},null,2);return await k.put("/theme/file",{path:j,contents:w}),j},onSuccess:n=>{n&&(a.invalidateQueries({queryKey:["theme-tree"]}),d(n),s.show(`Created ${n}.`,{duration:1800}))},onError:n=>s.show(n.message||"Couldn't create.",{tone:"error"})}),v=l.useMemo(()=>{const n=new Set;for(const b of Object.keys(i))i[b]!==f[b]&&n.add(b);return n},[i,f]);function D(n){d(n)}function C(n){o(b=>({...b,[t]:n}))}const V=l.useCallback((n,b)=>{y(b?`<${n} class="${b}">`:`<${n}>`)},[]),z=t.toLowerCase().endsWith($),S=!z&&t.toLowerCase().endsWith(".html");return e.jsxs("div",{className:"flex h-full min-h-0 flex-1 flex-col",children:[e.jsxs("header",{className:"flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-6 py-3",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-base font-semibold",children:"Theme editor"}),e.jsxs("p",{className:"text-xs text-zinc-500",children:["Editing ",e.jsx("strong",{children:((E=m.data)==null?void 0:E.theme)||"…"})," — changes save to disk and the preview reloads.",x&&e.jsx("span",{className:"ml-2 font-mono text-[11px] text-amber-700",children:x})]})]}),e.jsx(N,{onClick:()=>g.mutate(),disabled:g.isPending,children:g.isPending?"Creating…":"+ New visual template"})]}),e.jsxs("div",{className:`grid min-h-0 flex-1 ${z||S?"grid-cols-[240px_minmax(0,1fr)]":"grid-cols-[240px_minmax(0,1fr)_minmax(0,1fr)]"}`,children:[e.jsx(X,{entries:(_=m.data)==null?void 0:_.entries,currentPath:t,dirty:v,onSelect:D}),z?e.jsx(oe,{currentPath:t,buffer:i[t],saved:f[t],loading:u.isLoading,saving:r.isPending,error:((L=u.error)==null?void 0:L.message)||((P=r.error)==null?void 0:P.message),onChange:C,onSave:()=>r.mutate()}):S?e.jsx(l.Suspense,{fallback:e.jsx("div",{className:"p-6 text-sm text-zinc-500",children:"Loading visual editor…"}),children:e.jsx(le,{path:t,contents:i[t]??"",loading:u.isLoading,error:(T=u.error)==null?void 0:T.message,dirty:v.has(t),saving:r.isPending,saveError:(A=r.error)==null?void 0:A.message,onChange:C,onSave:()=>r.mutate()})}):e.jsxs(e.Fragment,{children:[e.jsx(ne,{path:t,contents:i[t]??"",loading:u.isLoading,error:(O=u.error)==null?void 0:O.message,dirty:v.has(t),saving:r.isPending,saveError:(W=r.error)==null?void 0:W.message,onChange:C,onSave:()=>r.mutate()}),e.jsx(ie,{version:p,onHover:V})]})]})]})}function oe({currentPath:a,buffer:s,saved:t,loading:d,saving:i,error:o,onChange:f,onSave:c}){const p=l.useMemo(()=>de(s),[s]),h=l.useCallback(y=>{f(JSON.stringify({blocks:y},null,2))},[f]),x=s!==t;return d?e.jsxs("div",{className:"p-6 text-sm text-zinc-500",children:["Loading ",a,"…"]}):e.jsxs("div",{className:"flex min-h-0 flex-col",children:[e.jsxs("div",{className:"flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2",children:[e.jsxs("div",{className:"flex items-center gap-2 truncate",children:[e.jsx("code",{className:"truncate font-mono text-[12px] text-zinc-800",children:a}),e.jsx("span",{className:"rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700",children:"Visual"}),x&&e.jsx("span",{className:"rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800",children:"Unsaved"})]}),e.jsx(N,{onClick:c,disabled:!x||i,children:i?"Saving…":"Save (⌘S)"})]}),o&&e.jsx("div",{className:"border-b border-red-100 bg-red-50 px-4 py-2 text-[13px] text-red-700",children:o}),e.jsx("div",{className:"min-h-0 flex-1",children:e.jsx(H,{tree:p,onChange:h,pageMeta:{}})})]})}function de(a){if(!a)return[];try{const s=JSON.parse(a);return Array.isArray(s==null?void 0:s.blocks)?s.blocks:[]}catch{return[]}}export{fe as default};
