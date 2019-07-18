oldList = [
  {tagName: 'li', props: { id: 'li-1'}, key: 'li-1',},
  {tagName: 'li', props: { id: 'li-2'}, key: 'li-2',},
  {tagName: 'li', props: { id: 'li-3'}, key: 'li-3',},
  {tagName: 'li', props: { id: 'li-4'}}
]

newList = [
  {tagName: 'li', props: {id: 'li-5'}, key: 'li-5'},
  {tagName: 'li', props: { id: 'li-1'}, key: 'li-1'},
  {tagName: 'li', props: { id: 'li-2'}, key: 'li-2'},
  {tagName: 'li', props: { id: 'li-3'}, key: 'li-3'},
  {tagName: 'li', props: { id: 'li-4'}}
]

debugger;
listDiff(oldList, newList, 'key');



function listDiff (oldList, newList, key) {
  let oldMap = makeKeyIndexAndFree(oldList, key);
  let newMap = makeKeyIndexAndFree(newList, key);

  let newFree = newMap.free;  // 用来存放新的children中，没有key属性值的子节点

  let oldKeyIndex = oldMap.keyIndex;  // 旧节点key属性值的索引值对象
  let newKeyIndex = newMap.keyIndex;  // 新节点key属性值的索引值对象

  let children = [];
  let moves = [];

  let i = 0;
  let item;
  let itemKey;
  let freeIndex = 0;

  // 遍历旧子节点中所有的节点
  while (i < oldList.length) {
    // item为旧节点
    item = oldList[i];
    // itemKey为item节点的key属性值
    itemKey = getItemKey(item, key);
    if (itemKey) {
      // 如果旧节点key属性值存在
      if (!newKeyIndex.hasOwnProperty(itemKey)) {
        // 新节点索引值对象中 不存在 itemKey 表明  将旧节点中 key值为itemKey的节点删除了
        children.push(null);
      } else {
        // newItemIndex 为新节点中,item得索引值
        var newItemIndex = newKeyIndex[itemKey];
        // 将新节点放入children数组中，此时children中节点的顺序为旧节点数组的顺序
        children.push(newList[newItemIndex])
      }
    } else {
      // 如果旧节点中不存在key属性
      let freeItem = newFree[freeIndex++];
      children.push(freeItem || null); // 将新节点中没有key属性值的节点放入children数组中
    }
    i++;
  }

  // children的长度和旧数组的长度一致
  // simulate 模拟 假冒的
  let simulateList = children.slice(0);

  i = 0;
  // 如果children中节点为null,记录节点的位置（索引值）
  while (i < simulateList.length) {
    if (simulateList[i] == null) {
      remove(i); // moves.push({index: i, type: 0});
      removeSimulate(i);  // simulateList.splice(index, 1);
    } else {
      i++;
    }
  }

  let j = i = 0;
  // 遍历新的子节点数组
  while (i < newList.length) {
    item = newList[i];
    itemKey = getItemKey(item, key); // itemKey 为新节点中key的属性值

    let simulateItem = simulateList[i];
    let simulateItemKey = getItemKey(simulateItem, key);

    if (simulateItem) {
      if (itemKey === simulateItemKey) {
        j++
      } else {
        if (!oldKeyIndex.hasOwnProperty(itemKey)) {
          insert(i,item)
        }else {
          let nextItemKey = getItemKey(simulateList[j + 1], key)
          if (nextItemKey === itemKey) {
            remove(i);
            removeSimulate(j);
            j++
          } else {
            insert(i, item)
          }
        }
      }
    } else {
      insert(i,item);
    }

    i++;
  }

  function remove (index) {
    let move = {index: index, type: 0}
    moves.push(move);
  }

  function insert(index, item) {
    let move = {index: index, item: item, type: 1}
    moves.push(move)
  }

  function removeSimulate (index) {
    simulateList.splice(index, 1);
  }

  return {
    moves,
    children
  }


}

function makeKeyIndexAndFree(list, key) {
  let keyIndex = {};
  let free = [];

  for (let i = 0, len = list.length; i < len; i++) {
    // i 表示当前遍历的节点 在 children 中的索引值， item表示当前遍历的节点
    item = list[i];
    let itemKey = getItemKey(item, key); // 节点的key属性值
    if (itemKey) {
      // 如果节点的key属性值存在  记录key属性值节点的位置
      keyIndex[itemKey] = i;
    } else {
      // 如果节点的key属性不存在  作为常规节点处理
      free.push(item)
    }
  }

  return {
    keyIndex, // {'11111': 2, '22222: 3, '33333': 1, '44444': 0}
    free
  }
}

function getItemKey(item, key) {
  if (!item || !key) return;
  return typeof key === 'string' ? item[key] : key(item);
}