// --------------------------------用js对象模拟dom树-----------------------------------
const Element = function (tagName, props, children) {
  this.tagName = tagName;
  this.props = props;
  this.children = children;
}

const el = function (tagName, props, children) {
  return new Element(tagName, props, children);
}

let ul = el('ul', { id: 'list' }, [
  el('li', { class: 'item' }, ['Item 1']),
  el('li', { class: 'item' }, ['Item 2']),
  el('li', { class: 'item' }, ['Item 3'])
])

Element.prototype.render = function () {
  let element = document.createElement(this.tagName);
  let props = this.props;

  for (let attr in props) {
    if (props.hasOwnProperty(attr)) {
      element.setAttribute(attr, props[attr]);
    }
  }

  let children = this.children || [];
  children.forEach(child => {
    let childEl = child instanceof Element ? child.render() : document.createTextNode(child);

    element.appendChild(childEl);
  })

  return element;
}

let ulroot = ul.render();
let script = document.querySelector('script');
document.querySelector('body').insertBefore(ulroot, script);

const utils = {
  type(value) {
    return Object.prototype.toString.call(value).replace(/\[object\s|\]/g, '');
  },
  isString(value) {
    return this.type(value) === 'String';
  }
}


// -----------------------------------比较两棵虚拟DOM树的差异 深度优先遍历，记录差异------------------------
// 定义差异类型  
const REPLACE = 0; // 替换
const ADD = 1; // 新增节点
const MOVE = 2; // 移动节点
const REMOVE = 3; // 移除节点
const PROPS = 4; // 修改节点属性
const TEXT = 5; // 替换文本内容

// diff 函数，对比两棵树
function diff(oldNode, newNode) {
  const patches = {}; // 记录所有的差异
  let index = 0; // 节点表示，从0开始

  dfsWalk(oldNode, newNode, index, patches);

  return patches;
}

// 对两棵树进行深度优先遍历
/**
 * 
 * @param {Object} oldNode // 旧节点
 * @param {Object} newNode  // 新节点
 * @param {Number} index  // 当前遍历的节点
 * @param {Object} patches  // 用来记录节点差异的对象
 */
function dfsWalk(oldNode, newNode, index, patches) {
  const currentPatch = [];

  if (newNode == null) {
    currentPatch.push({ type: REMOVE });
  } else if (utils.isString(oldNode) && utils.isString(newNode)) {
    // 文本节点
    currentPatch.push({ type: TEXT, content: newNode })
  } else if (oldNode.tagName === newNode.tagName && oldNode.key === newNode.key) {
    // 标签一样，key一样  对比属性
    let propsPatches = diffProps(oldNode, newNode);
    if (propsPatches) {
      currentPatch.push({ type: PROPS, props: propsPatches })
    }
  } else if (!isIgnoreChildren(newNode)) {
    // 递归遍历子节点
    diffChildren(
      oldNode.children,
      newNode.children,
      index,
      patches,
      currentpatch
    )


  } else {
    currentPatch.push({ type: REPLACE, node: newNode });
  }

  if (currentPatch.length) {
    patches[index] = currentPatch;
  }
}

// 遍历子节点
function diffChildren(oldChildren, newChildren, index, patches, currentPatch) {
  var diffs = listDiff(oldChildren, newChildren, 'key')
  newChildren = diffs.children

  if (diffs.moves.length) {
    var reorderPatch = { type: patch.REORDER, moves: diffs.moves }
    currentPatch.push(reorderPatch)
  }

  let currentNodeIndex = index;
  oldChildren.forEach((child, i) => {
    let newChild = newChildren[i];
    // 遍历子节点  节点标识需要+1
    currentNodeIndex++;
    // 继续对比子节点
    dfsWalk(child, newChild, currentNodeIndex, patches);
  })
}

// 对比属性差异
function diffProps(oldNode, newNode) {
  // 修改属性  新增属性  删除属性
  let oldProps = oldNode.props;
  let newProps = newNode.props;
  let propsPatches = {};
  let count = 0; // 用来保存差异属性的数量，如果数量为空，返回null

  // 处理修改和删除属性
  for (let key in oldProps) {
    if (oldProps[key] !== newProps[key]) {
      // 新属性和旧属性不同  保存修属性到propsPatches中
      propsPatches[key] = newProps[key];
      count++;
    }
  }

  // 处理新增属性
  for (let key in newProps) {
    if (!oldProps.hasOwnProperty(key)) {
      propsPatches[key] = newProps[key];
      count++;
    }
  }

  if (count == 0) {
    // 没有差异属性  返回null
    return null;
  }

  return propsPatches;
}

function isIgnoreChildren(node) {
  return (node.props && node.props.hasOwnProperty('ignore'))
}