/** OCodeJS navigation contract. No authentication or session management. */
export const OCODEJS_NAVIGATION=Object.freeze([
{id:"home",label:"Overview",href:"/",group:"workspace"},
{id:"discover",label:"Discover",href:"/ecosystem/",group:"workspace"},
{id:"builder",label:"Build",href:"https://github.com/OCodejs/OCodejs",group:"create"},
{id:"ai",label:"AI Studio",href:"https://github.com/OCodejs/ask-chatbot",group:"create"},
{id:"developer",label:"Developer",href:"https://github.com/OCodejs/cli-hub",group:"build"},
{id:"docs",label:"Documentation",href:"https://github.com/OCodejs/docs-ocodejs",group:"learn"},
{id:"account",label:"Account status",href:"https://github.com/OCodejs/mcp.auth.ocodejs",group:"identity",status:"preview-unverified"}
]);
export function renderOcodejsNavigation(root,{active="home"}={}){if(!root)throw new TypeError("A navigation root element is required.");const nav=document.createElement("nav");nav.className="oc-nav";nav.setAttribute("aria-label","OCodeJS ecosystem");for(const item of OCODEJS_NAVIGATION){const link=document.createElement("a");link.className="oc-nav-link";link.href=item.href;link.textContent=item.label;if(item.id===active)link.setAttribute("aria-current","page");if(/^https:\/\//.test(item.href)){link.target="_blank";link.rel="noopener noreferrer"}if(item.status)link.dataset.status=item.status;nav.append(link)}root.replaceChildren(nav);return nav}
