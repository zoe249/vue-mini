export function getSequence(arr) {
    const result = [0]
    // 保存索引
    const p = arr.slice(0)
    const len = arr.length
    let start
    let end
    let middle
    for (let i = 0; i < len; i++) {
        const arrI = arr[i]
        // 处理数组中 0 的情况
        if (arrI !== 0) {
            // 拿出结果集对于的最后一项，和当前的这一项进行对比
            let resultLastIndex = result[result.length - 1]
            if (arr[resultLastIndex] < arrI) {
                // 记录当前这一项的前一个索引
                p[i] = result[result.length - 1]
                // 将当前索引添加到结果集
                result.push(i)
                continue
            }
        }

        start = 0
        end = result.length - 1

        while (start < end) {
            middle = ((start + end)) / 2 | 0
            if (arr[result[middle]] < arrI) {
                start = middle + 1
            } else {
                end = middle
            }
        }
        if (arrI < arr[result[start]]) {
            p[i] = result[start - 1]
            result[start] = i
        }
        console.log(start, end)
    }

    let l = result.length
    let last = result[l - 1]
    while (l-- > 0) {
        result[l] = last
        last = p[last]
    }
    return result
}

// console.log(getSequence([0, 5, 6, 7, 9, 11]))
// console.log(getSequence([1, 2, 20, 4, 5, 8, 9, 10, 6]))
console.log(getSequence([2, 3, 1, 5, 6, 8, 7, 9, 4]))
// 3 5 6 7 9
