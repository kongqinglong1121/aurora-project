$A.Tree=Ext.extend($A.Component,{showSkeleton:true,sw:18,constructor:function(a){$A.Tree.superclass.constructor.call(this,a);this.context=a.context||""},initComponent:function(a){this.nodeHash={};$A.Tree.superclass.initComponent.call(this,a);this.body=this.wrap.child("div[atype=tree.body]")},processListener:function(a){$A.Tree.superclass.processListener.call(this,a);this.wrap[a]("click",this.onClick,this)[a]("dblclick",this.onDblclick,this)},initEvents:function(){$A.Tree.superclass.initEvents.call(this);this.addEvents("render","collapse","expand","click","dblclick")},destroy:function(){$A.Tree.superclass.destroy.call(this)},processDataSetLiestener:function(a){var b=this.dataset;if(b){b[a]("update",this.onUpdate,this);b[a]("load",this.onLoad,this);b[a]("indexchange",this.onIndexChange,this);b[a]("add",this.onAdd,this);b[a]("remove",this.onRemove,this)}},bind:function(b){if(typeof(b)==="string"){b=$(b);if(!b){return}}var a=this;a.dataset=b;a.processDataSetLiestener("on");$A.onReady(function(){a.onLoad()})},onAdd:function(c,j){var e=this.dataset.getAll(),h=j.get(this.parentfield);if(Ext.isEmpty(h)){return}var k,b=this.sequencefield,m=j.get(b),d;for(var g=0,f=e.length;g<f;g++){var a=e[g];if(a.get(this.idfield)===h){k=this.getNodeById(a.id);break}}if(!k){k=this.root}Ext.each(k.childNodes,function(n){var l=n.record.get(b);if(l&&l>m){d=n;return false}});k.insertBefore(this.createTreeNode(this.createNode(j)),d)},onRemove:function(c,e){var a=e.id,d=this.getNodeById(a);if(d){var k=d.parentNode,f=d.previousSibling,h=d.nextSibling;if(k){this.unregisterNode(d,true);k.removeChild(d);if(!this.focusNode||this.focusNode===d){var g=-1,j=k.data.children;Ext.each(j,function(l){if(l.record.id==a){g=i;return false}});if(g!=-1){var c=e.ds,b;j.remove(j[g]);c.locate(c.indexOf((b=j[g-1])&&b.record||(b=j[g])&&b.record||k.record)+1)}}}}},onUpdate:function(d,a,b,c){if(this.parentfield==b||b==this.sequencefield){this.onLoad()}else{this.nodeHash[a.id].paintText()}},onIndexChange:function(c,a){var b=this.nodeHash[a.id];if(b){this.setFocusNode(b)}},isAllParentExpand:function(a){var b=a.parentNode;return !b||(b.isExpand&&this.isAllParentExpand(b))},onClick:function(f,b){var e=Ext.fly(b).findParent("td");if(!e){return}var a=e._type_;if(a===undefined){return}e=Ext.fly(b).findParent("div.item-node");var d=this.nodeHash[e.indexId];if(a=="clip"){if(d){if(d.isExpand){d.collapse();this.fireEvent("collapse",this,d)}else{d.expand();this.fireEvent("expand",this,d)}}}else{if(a=="icon"||a=="text"){this.setFocusNode(d);var g=this.dataset,c=d.record;g.locate(g.indexOf(c)+1,true);this.fireEvent("click",this,c,d)}else{if(a=="checked"){d.onCheck()}}}},onDblclick:function(f,b){var e=Ext.fly(b).findParent("td");if(!e){return}var a=e._type_;if(typeof(a)===undefined){return}e=Ext.fly(b).findParent("div.item-node");if(a=="icon"||a=="text"){var d=this.nodeHash[e.indexId];if(d&&d.childNodes.length){if(d.isExpand){d.collapse();this.fireEvent("collapse",this,d)}else{d.expand();this.fireEvent("expand",this,d)}}this.setFocusNode(d);var g=this.dataset,c=d.record;g.locate(g.indexOf(c)+1,true);this.fireEvent("dblclick",this,c,d)}},getRootNode:function(){return this.root},setRootNode:function(a){this.root=a;a.ownerTree=this;this.registerNode(a);a.cascade((function(b){this.registerNode(b)}),this)},getNodeById:function(a){return this.nodeHash[a]},registerNode:function(a){this.nodeHash[a.id]=a},unregisterNode:function(a,b){delete this.nodeHash[a.id];if(b){Ext.each(a.childNodes,function(c){this.unregisterNode(c,b)},this)}},setFocusNode:function(a){var b=this.focusNode,c=a.parentNode;if(b){b.unselect()}this.focusNode=a;if(c){c.expand()}a.select()},createNode:function(a){return{record:a,children:[]}},buildTree:function(){var j=[],h={},g={},c=this.dataset,b,a=function(p){var o=p.children,n=0,q=0;Ext.each(o,function(r){if(r.children.length>0){a(r)}});Ext.each(o,function(r){if(r.checked==2){q=1}else{if(r.checked==1){n++;q=1}}});if(n==0&&q==0){p.checked=0}else{if(o.length==n){p.checked=1}else{if(q!=0){p.checked=2}}}};Ext.each(c.data,function(n){var p=n.get(this.idfield),o=this.createNode(n);o.checked=(n.get(this.checkfield)=="Y")?1:0;o.expanded=n.get(this.expandfield)=="Y";h[p]=o;g[p]=o},this);for(var m in g){var d=g[m],l=g[d.record.get(this.parentfield)];if(l){l.children.add(d);delete h[m]}}for(var m in h){j.push(g[m])}if(j.length==1){this.showRoot=true;b=j[0]}else{var e={};e[this.displayfield]="_root";var f=new Aurora.Record(e),k={record:f,children:[]};f.setDataSet(c);Ext.each(j,function(n){k.children.push(n)});this.showRoot=false;b=k}Ext.each(j,function(n){if(n.children.length>0){a(n)}});this.sortChildren(b.children,this.sequencefield);return b},sortChildren:function(b,c){if(c){var a=Number.MAX_VALUE;b.sort(function(e,d){return parseFloat(e.record.get(c)||a)-parseFloat(d.record.get(c)||a)})}else{b.sort()}Ext.each(b,function(d){this.sortChildren(d.children,c)},this)},createTreeNode:function(a){return new $A.Tree.TreeNode(a)},onLoad:function(){var a=this.buildTree();if(!a){return}var b=this.createTreeNode(a);this.setRootNode(b);this.body.update("");this.root.render();this.fireEvent("render",this,a)},getIconByType:function(a){return a},onNodeSelect:function(a){a[this.displayfield+"_text"].style.backgroundColor="#dfeaf5"},onNodeUnSelect:function(a){a[this.displayfield+"_text"].style.backgroundColor=""},initColumns:function(a){}});$A.Tree.TreeNode=function(a){this.init(a)};$A.Tree.TreeNode.prototype={init:function(a){this.data=a;this.record=a.record;this.els=null;this.id=this.record.id;this.parentNode=null;this.childNodes=[];this.lastChild=null;this.firstChild=null;this.previousSibling=null;this.nextSibling=null;this.childrenRendered=false;this.isExpand=a.expanded;this.checked=a.checked;Ext.each(a.children,function(b){this.appendChild(this.createNode(b))},this)},createNode:function(a){return new $A.Tree.TreeNode(a)},createCellEl:function(b){var a=this.els[b+"_text"]=document.createElement("div");this.els[b+"_td"].appendChild(a)},initEl:function(){var o=this.getOwnerTree(),j=o.displayfield,k=this.record.get(j),a=document.createElement("div"),b=document.createElement("div"),l=document.createElement("table"),e=document.createElement("tbody"),g=document.createElement("tr"),f;a.className="item-node";l.border=0;l.cellSpacing=0;l.cellPadding=0;this.els={element:a,itemNodeTable:l,itemNodeTbody:e,itemNodeTr:g,child:b};e.appendChild(g);l.appendChild(e);a.appendChild(l);if(o.showSkeleton){var n=g.insertCell(-1),c=g.insertCell(-1),h=this.icon?document.createElement("img"):document.createElement("div"),m=g.insertCell(-1);f=g.insertCell(-1);n._type_="line";n.className="line";c._type_="clip";c.innerHTML="&#160";m._type_="icon";f._type_="checked";f.innerHTML="&#160";Ext.fly(m).setWidth(18);m.appendChild(h);Ext.apply(this.els,{line:n,clip:c,icon:h,iconTd:m,checkbox:f})}var d=g.insertCell(-1);this.els[j+"_td"]=d;this.createCellEl(j);d.className="node-text";o.initColumns(this);a.noWrap="true";d._type_="text";if(o.showcheckbox===false&&f){f.style.display="none"}if(this.isRoot()&&k=="_root"){l.style.display="none"}a.appendChild(b);b.className="item-child";b.style.display="none"},render:function(){var a=this.getOwnerTree();this.icon=this.record.get(a.iconfield);if(!this.els){this.initEl()}var b=this.els,c=b.element;if(this.isRoot()){a.body.appendChild(c);if(a.showRoot==false&&a.showSkeleton){b.icon.style.display=b.checkbox.style.display=b[a.displayfield+"_text"].style.display="none"}this.expand()}else{this.parentNode.els.child.appendChild(c);if(this.isExpand){this.expand()}}this.paintPrefix();c.indexId=this.id;this.paintCheckboxImg()},setWidth:function(b,a){if(this.width==a){return}this.width=a;this.doSetWidth(b,a);if(this.childrenRendered){Ext.each(this.childNodes,function(c){c.setWidth(b,a)})}},doSetWidth:function(c,b){if(!b){return}if(this.isRoot()&&this.showRoot==false){return}var d=this.els,a=this.getOwnerTree(),e=b-(c==a.displayfield&&a.showSkeleton?((a.showcheckbox?1:0)+this.getPathNodes().length)*a.sw:0);Ext.fly(d[c+"_td"]).setWidth(Math.max((e),0));Ext.fly(d[c+"_text"]).setWidth(Math.max((e-2),0))},paintPrefix:function(){this.paintLine();this.paintClipIcoImg();this.paintCheckboxImg();this.paintIconImg();this.paintText()},paintLine:function(){var j=this.getOwnerTree();if(!j.showSkeleton){return}var f=this.getPathNodes(),h=(f.length-2)*j.sw,k=this.els.line,g=document.createElement("div");k.innerHTML="";Ext.fly(k).setWidth(h);if(h==0){k.style.display="none"}Ext.fly(g).setWidth(h);for(var d=1,e=f.length-1;d<e;d++){var b=f[d],a=document.createElement("div");a.className=b.isLast()?"node-empty":"node-line";g.appendChild(a)}k.appendChild(g)},paintClipIcoImg:function(){var a=this.getOwnerTree();if(!a.showSkeleton){return}var c=this.els.clip,d="empty",b;if(this.isRoot()){c.style.display="none";return}else{d=this.isLeaf()&&"join"||this.isExpand&&"minus"||"plus";b=this.isLast()&&"Bottom"||this.isFirst()&&"Top"||""}c.className="node-clip clip-"+d+b;c.innerHTML='<DIV class="tree_s"> </DIV>'},paintIconImg:function(){var a=this.getOwnerTree();if(!a.showSkeleton){return}var e=this.data,c=e.icon,d=this.els.icon;if(!c){var b=e.type;if(b){c=a.getIconByType(b)}if(!c){if(this.isRoot()){c="root"}else{if(this.isLeaf()){c="node"}else{if(this.isExpand){c="folderOpen"}else{c="folder"}}}}}if(this.icon){d.className="node-icon";d.src=a.context+this.icon}else{d.className="node-icon icon-"+c}d.style.width=18;d.style.height=18},paintCheckboxImg:function(){if(!this.els||!this.getOwnerTree().showSkeleton){return}var a=this.checked;this.els.checkbox.className=a==2?"checkbox2":a==1?"checkbox1":"checkbox0";this.els.checkbox.innerHTML='<DIV class="_s"> </DIV>'},paintText:function(){if(!this.els){return}var a=this.getOwnerTree(),b=this.record,e=a.displayfield,c=a.renderer,d=b.get(e);if(!Ext.isEmpty(c)){c=window[c];if(c){d=c.call(this,d,b,this)}}this.els[e+"_text"].innerHTML=d},paintChildren:function(){if(!this.childrenRendered){this.els.child.innerHTML="";this.childrenRendered=true;Ext.each(this.childNodes,function(a){a.render()})}},collapse:function(){this.isExpand=false;if(!this.isRoot()){this.record.set(this.getOwnerTree().expandfield,"N",true)}this.els.child.style.display="none";this.paintIconImg();this.paintClipIcoImg();this.refreshDom()},expand:function(){var a=this.parentNode;if(a&&a.isExpand==false){a.expand()}if(!this.isLeaf()&&this.childNodes.length>0){if(!this.isRoot()){this.record.set(this.getOwnerTree().expandfield,"Y",true)}this.isExpand=true;this.paintChildren();this.els.child.style.display="block"}this.paintIconImg();this.paintClipIcoImg();this.refreshDom()},refreshDom:function(){this.getOwnerTree().wrap.addClass("a");this.getOwnerTree().wrap.removeClass("a")},select:function(){this.isSelect=true;this.getOwnerTree().onNodeSelect(this.els)},unselect:function(){this.isSelect=false;if(this.getOwnerTree()){this.getOwnerTree().onNodeUnSelect(this.els)}},getEl:function(){return this.els},setCheckStatus:function(e){var h;if(e==2||e==3){var f=this.childNodes,d=f.length;if(d==0){h=e==2?0:1}else{var a=0,g=0;for(var b=0;b<d;b++){var e=f[b].checked;if(e==1){a++}else{if(e==2){g++}}}h=(f.length==a)?1:(a>0||g>0)?2:0}}else{h=e}this.checked=h;if(!this.isRoot()||this.showRoot!=false){this.record.set(this.getOwnerTree().checkfield,(h==1||h==2)?"Y":"N")}this.paintCheckboxImg()},setCheck:function(e){var d=e?1:0,c=d+2;this.cascade(function(a){a.setCheckStatus(d)});this.bubble(function(a){a.setCheckStatus(c)})},onCheck:function(){this.setCheck(this.checked==0)},isRoot:function(){return this.ownerTree&&this.ownerTree.root===this},isLeaf:function(){return this.childNodes.length===0},isLast:function(){var a=this.parentNode;return !a?true:a.childNodes[a.childNodes.length-1]==this},isFirst:function(){var a=this.getOwnerTree(),b=this.parentNode;return b==a.getRootNode()&&!a.showRoot&&b.childNodes[0]==this},hasChildNodes:function(){return this.childNodes.length>0},setFirstChild:function(a){this.firstChild=a},setLastChild:function(a){this.lastChild=a},appendChild:function(b){if(!Ext.isArray(b)&&arguments.length>1){b=arguments}var a=this.getOwnerTree();Ext.each(b,function(e){var d=e.parentNode;if(d){d.removeChild(e)}var f=this.childNodes,c=f.length,g=f[c-1];if(c==0){this.setFirstChild(e)}f.push(e);e.parentNode=this;if(g){e.previousSibling=g;g.nextSibling=e}else{e.previousSibling=null}e.nextSibling=null;this.setLastChild(e);e.setOwnerTree(a);if(this.childrenRendered){e.render()}if(this.els){this.cascade(function(h){h.paintPrefix();if(!h.childrenRendered){return false}})}},this);return b},removeChild:function(c){var d=this.childNodes,a=d.indexOf(c);if(a==-1){return false}d.splice(a,1);var e=c.previousSibling,g=c.nextSiblin,b=c.els;if(e){e.nextSibling=g}if(g){g.previousSibling=e}if(this.firstChild==c){this.setFirstChild(g)}if(this.lastChild==c){this.setLastChild(e)}c.setOwnerTree(null);c.parentNode=null;c.previousSibling=null;c.nextSibling=null;if(this.childrenRendered){if(b){var f=b.element;if(f){this.els.child.removeChild(f)}}if(d.length==0){this.collapse()}}if(this.els){this.cascade(function(h){h.paintPrefix();if(!h.childrenRendered){return false}})}return c},insertBefore:function(c,a){if(!a){return this.appendChild(c)}if(c==a){return false}var d=this.childNodes,e=d.indexOf(a),b=c.parentNode;if(b==this&&d.indexOf(c)<e){e--}if(b){b.removeChild(c)}if(e==0){this.setFirstChild(c)}d.splice(e,0,c);c.parentNode=this;var f=d[e-1];if(f){c.previousSibling=f;f.nextSibling=c}else{c.previousSibling=null}c.nextSibling=a;a.previousSibling=c;c.setOwnerTree(this.getOwnerTree());if(this.childrenRendered){this.childrenRendered=false;this.paintChildren()}if(this.els){this.paintPrefix()}return c},replaceChild:function(a,b){this.insertBefore(a,b);this.removeChild(b);return b},indexOf:function(a){return this.childNodes.indexOf(a)},getOwnerTree:function(){if(!this.ownerTree){this.bubble(function(a){if(a.ownerTree){this.ownerTree=a.ownerTree;return false}},this)}return this.ownerTree},setOwnerTree:function(a){var b=this.ownerTree;if(a!=b){if(b){b.unregisterNode(this)}this.ownerTree=a;Ext.each(this.childNodes,function(d){d.setOwnerTree(a)});if(a){a.registerNode(this)}}},getPathNodes:function(){var a=[];this.bubble(function(){a.unshift(this)});return a},bubble:function(c,b,a){var d=this;while(d){if(c.call(b||d,a||d)===false){break}d=d.parentNode}},cascade:function(f,e,b){if(f.call(e||this,b||this)!==false){var d=this.childNodes;for(var c=0,a=d.length;c<a;c++){d[c].cascade(f,e,b)}}},findChild:function(a,b){var d=null;Ext.each(this.childNodes,function(c){if(c.attributes[a]==b){d=c;return false}});return d},findChildBy:function(b,a){var d=null;Ext.each(this.childNodes,function(c){if(b.call(a||c,c)===true){d=c;return false}});return d},sort:function(e,d){var c=this.childNodes,a=c.length;if(a>0){c.sort(d?e.createDelegate(d):e);for(var b=0;b<a;b++){var f=c[b];f.previousSibling=c[b-1];f.nextSibling=c[b+1];if(b==0){this.setFirstChild(f)}if(b==a-1){this.setLastChild(f)}}}},toString:function(){return"[Node"+(this.id?" "+this.id:"")+"]"}};