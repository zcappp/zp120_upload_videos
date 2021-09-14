import React from "react"
import css from "../css/zp120_批量上传视频.css"

function render(ref) {
    const { exc, render, props, arr = [] } = ref
    const isUploading = arr.find(a => a.startsWith("blob"))
    return <React.Fragment>
        {arr.map((a, i) => <div className={"zp120B zp120_" + i + (a.startsWith("blob") ? " zp120U" : " zp120Z")} onClick={() => { if(!a.startsWith("blob")) { ref.zoom = a; render() }}} key={a + i}>
            <div/>
            {a.startsWith("blob") || !a.endsWith("mp4") ? <video src={a}/> : <img src={a + "?x-oss-process=video/snapshot,m_fast,t_5000,w_0,ar_auto"}/>}
            {a.startsWith("blob") ? "" : <i className="zplaybtn"/>}
            {!isUploading && <span onClick={e => remove(ref, i, e)}>{EL.del}</span>}
            {!isUploading && EL.handle}
        </div>)}
        {EL.网盘}
        <div className="zp120B">
            <div>{EL.camera}<label>{props.dbf ? props.label || "上传视频" : "请配置表单字段"}</label></div>
            <input onChange={e => onChange(ref, e)} type="file" accept="video/*" multiple="multiple"/>
        </div>
        {ref.zoom && <div onClick={() => {delete ref.zoom; render()}} className="zmask"><video src={ref.zoom} controls="controls" autoPlay="autoplay"/>{EL.del}</div>}
        <div style={{display: "none"}}/>
    </React.Fragment>
}

function onInit(ref) {
    const { id, exc, props, render } = ref
    const arr = ref.getForm(props.dbf)
    if (Array.isArray(arr)) {
        ref.arr = [...arr]
    } else {
        if (arr) warn("表单字段必须是数组")
        ref.arr = []
    }
    if (props.gallery) {
        EL.网盘 = render({ t: "Plugin", p: { ID: "zp101", P: { mineOnly: true, onSelect: '$("#' + id + '").add(url)', type: "v", label: "视频库" } } }, id + "_0")
        ref.container.add = url => {
            ref.arr.push(url)
            let arr = ref.getForm(props.dbf)
            if (!Array.isArray(arr)) arr = []
            arr.push(url)
            ref.setForm(props.dbf, arr)
        }
    }
    exc('load("//z.zcwebs.cn/vendor/Sortable_1.13.0.js")', {}, () => {
        new Sortable(ref.container, {
            animation: 150,
            forceFallback: true,
            fallbackTolerance: 5,
            onSort: e => {
                let arr = ref.getForm(props.dbf)
                if (!Array.isArray(arr)) arr = []
                arr.splice(e.newDraggableIndex, 0, arr.splice(e.oldDraggableIndex, 1)[0])
                ref.setForm(props.dbf, arr)
                ref.arr = [...arr]
                render()
            },
            handle: "#" + id + " .zp120handler",
            draggable: ".zp120Z",
            dragClass: "zp120Drag",
            ghostClass: "zp120Drop"
        })
    })
}

function onChange(ref, e) {
    const { exc, render, props } = ref
    const arr = Array.from(e.target.files)
    if (!arr.length) return exc('warn("请选择视频")')
    arr.forEach((file, i) => setTimeout(() => {
        const x = URL.createObjectURL(file)
        ref.arr.push(x)
        render()
        exc('upload(file, option)', {
            file,
            option: {
                onProgress: r => {
                    $("#" + ref.id + " .zp120_" + ref.arr.indexOf(x) + " div").innerHTML = r.percent + "%"
                },
                onSuccess: r => {
                    let arr = ref.getForm(props.dbf)
                    if (!Array.isArray(arr)) arr = []
                    arr.push(r.url)
                    ref.setForm(props.dbf, arr)
                    preload(r.url, ref.container, () => {
                        ref.arr.splice(ref.arr.indexOf(x), 1, r.url)
                        URL.revokeObjectURL(x)
                        exc('render()')
                    })
                },
                onError: r => {
                    exc(`alert("上传出错了", r.error)`, { r })
                    ref.arr.splice(ref.arr.indexOf(x), 1)
                    URL.revokeObjectURL(x)
                }
            }
        })
    }, 2000 * i))
}

function remove(ref, i, e) {
    e.stopPropagation()
    ref.exc('confirm("确定要删除吗？")', {}, () => {
        let arr = ref.getForm(ref.props.dbf)
        arr.splice(i, 1)
        ref.arr = [...arr]
        ref.setForm(ref.props.dbf, arr)
    })
}

function preload(url, container, onload) {
    let el = document.createElement(url.endsWith("mp4") ? "img" : "video")
    el.src = url.endsWith("mp4") ? url + "?x-oss-process=video/snapshot,m_fast,t_5000,w_0,ar_auto" : url
    url.endsWith("mp4") ? el.onload = onload : el.onloadstart = onload
    el.onerror = onload
    container.lastElementChild.appendChild(el)
}

$plugin({
    id: "zp120",
    props: [{
        prop: "dbf",
        type: "text",
        label: "表单字段"
    }, {
        prop: "label",
        type: "text",
        label: "[上传视频]文本"
    }, {
        prop: "gallery",
        type: "switch",
        label: "包含视频库"
    }],
    render,
    onInit,
    css
})

const EL = {
    camera: <svg className="zsvg zp120camera" viewBox="64 64 896 896"><path d="M912 302.3L784 376V224c0-35.3-28.7-64-64-64H128c-35.3 0-64 28.7-64 64v576c0 35.3 28.7 64 64 64h592c35.3 0 64-28.7 64-64V648l128 73.7c21.3 12.3 48-3.1 48-27.6V330c0-24.6-26.7-40-48-27.7zM712 792H136V232h576v560zm176-167l-104-59.8V458.9L888 399v226zM208 360h112c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H208c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8z"/></svg>,
    handle: <svg className="zsvg zp120handler" viewBox="0 0 1024 1024"><path d="M512 512M190.272 248.512l643.52 0 0 74.944-643.52 0 0-74.944ZM190.272 474.496l643.52 0 0 74.944-643.52 0 0-74.944ZM190.272 700.544l643.52 0 0 74.944-643.52 0 0-74.944Z"/></svg>,
    del: <svg className="zsvg zp120del" viewBox="64 64 896 896"><path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 0 0 203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"/></svg>
}


/*
zp120Z: zoom in/out
zp120B: block
zp120U: uploading

*/