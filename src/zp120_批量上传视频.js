import React from "react"
import css from "./zp120_批量上传视频.css"

function render(ref) {
    const { exc, render, props, arr = [] } = ref
    const isUploading = arr.find(a => a.startsWith("blob"))
    return <React.Fragment>
        {arr.map((a, i) => <div className={"zp120B zp120_" + i + (a.startsWith("blob") ? " zp120U" : " zp120Z")} onClick={() => { if(!a.startsWith("blob")) preview(ref, a)}} key={a + i}>
            <div className="zp120progress"/>
            {a.startsWith("blob") || !a.endsWith("mp4") ? <video src={a}/> : <img src={a + "?x-oss-process=video/snapshot,m_fast,t_5000,w_0,ar_auto"}/>}
            {a.startsWith("blob") ? "" : <i className="zplaybtn"/>}
            {!isUploading && <i onClick={e => remove(ref, i, e)} className="zdel zp120del"/>}
            {!isUploading && EL.handle}
        </div>)}
        {EL.网盘}
        <div className="zp120B">
            <div>{EL.camera}<label>{props.dbf ? props.label || "上传视频" : "请配置表单字段"}</label></div>
            <input onChange={e => onChange(ref, e)} type="file" accept="video/*" multiple="multiple"/>
            {!!ref.props.url && <span onClick={() => url(ref)}>URL</span>}
            {ref.modal}
        </div>
        <div style={{display: "none"}}/>
    </React.Fragment>
}

function init(ref) {
    const { getForm, id, exc, props, render } = ref
    if (!getForm) return exc('warn("请置于表单容器中")')
    const arr = getForm(props.dbf)
    if (Array.isArray(arr)) {
        ref.arr = [...arr]
    } else {
        if (arr) exc('warn("表单字段必须是数组")')
        ref.arr = []
    }
    if (props.gallery) {
        EL.网盘 = render({ t: "Plugin", p: { ID: "zp101", P: { mineOnly: true, onSelect: '$("#' + id + '").add(url)', type: "v", label: "视频库" } } }, id + "_0")
        ref.container.add = url => {
            ref.arr.push(url)
            let arr = getForm(props.dbf)
            if (!Array.isArray(arr)) arr = []
            arr.push(url)
            ref.setForm(props.dbf, arr)
        }
    }
    exc('load("//z.zccdn.cn/vendor/Sortable_1.13.0.js")', {}, () => {
        new Sortable(ref.container, {
            animation: 150,
            forceFallback: true,
            fallbackTolerance: 5,
            onSort: e => {
                let arr = getForm(props.dbf)
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
                    $("#" + ref.id + " .zp120_" + ref.arr.indexOf(x) + " .zp120progress").innerHTML = r.percent + "%"
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
        ref.exc('render()')
    })
}

function preload(url, container, onload) {
    let el = document.createElement(url.endsWith("mp4") ? "img" : "video")
    el.src = url.endsWith("mp4") ? url + "?x-oss-process=video/snapshot,m_fast,t_5000,w_0,ar_auto" : url
    url.endsWith("mp4") ? el.onload = onload : el.onloadstart = onload
    el.onerror = onload
    container.lastElementChild.appendChild(el)
}

function url(ref) {
    ref.modal = <div className="zmodals">
        <div className="zmask" onClick={() => close(ref)}/>
        <div className="zmodal">
            <i onClick={() => close(ref)} className="zdel"/>
            <h3 className="hd">通过URL上传</h3>
            <div className="bd"><textarea rows="10" placeholder="把视频URL粘贴在这里，每行一条" className="zinput"/></div>
            <div className="ft">
                <div className="zbtn" onClick={() => close(ref)}>取消</div>
                <div className="zbtn main" onClick={() => upload(ref)}>上传</div>
            </div>
        </div>
    </div>
    ref.render()
    setTimeout(() => {
        $(".zp120B .zmodals").classList.add("open")
        $(".zp120B .zmodal textarea").focus()
    }, 99)
}

function preview(ref, video) {
    ref.modal = <div className="zmodals">
        <div className="zmask" onClick={() => close(ref)}/>
        <div className="zmodal" style={{width:"100vw",height:"100vh"}}>
            <i onClick={() => close(ref)} className="zdel"/>
            <h3 className="hd">{ref.props.dbf}</h3>
            <div className="bd"><video src={video} controls="controls" autoPlay="autoplay"/></div>
        </div>
    </div>
    ref.render()
    setTimeout(() => $(".zp120B .zmodals").classList.add("open"), 99)
}

function close(ref) {
    ref.modal = ""
    ref.render()
}

function upload(ref) {
    const { exc } = ref
    let urls = $(".zp120 .zmodal textarea").value.split("\n").filter(a => !!a)
    if (!urls.length) return exc('alert("请输入视频URL")')
    exc('info("正在上传，请稍候")')
    close(ref)
    exc('$resource.uploads(urls, "v")', { urls }, r => {
        if (!r || r.ng.length) exc(`alert("上传出错了", reason)`, { reason: r ? JSON.stringify(r.ng, null, "\t") : "" })
        if (r.arr.length) {
            let arr = r.arr.map(a => a.url)
            ref.arr = [...ref.arr, ...arr]
            ref.setForm(ref.props.dbf, ref.arr)
            exc('render()')
        }
    })
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
    }, {
        prop: "url",
        type: "switch",
        label: "允许通过URL上传"
    }],
    render,
    init,
    css
})

const EL = {
    camera: <svg className="zsvg zp120camera" viewBox="64 64 896 896"><path d="M912 302.3L784 376V224c0-35.3-28.7-64-64-64H128c-35.3 0-64 28.7-64 64v576c0 35.3 28.7 64 64 64h592c35.3 0 64-28.7 64-64V648l128 73.7c21.3 12.3 48-3.1 48-27.6V330c0-24.6-26.7-40-48-27.7zM712 792H136V232h576v560zm176-167l-104-59.8V458.9L888 399v226zM208 360h112c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H208c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8z"/></svg>,
    handle: <svg className="zsvg zp120handler" viewBox="0 0 1024 1024"><path d="M256 160a96 96 0 1 0 0 192 96 96 0 0 0 0-192z m0 512a96 96 0 1 0 0 192 96 96 0 0 0 0-192zM672 256a96 96 0 1 1 192 0 96 96 0 0 1-192 0z m96 416a96 96 0 1 0 0 192 96 96 0 0 0 0-192z"/></svg>,
}


/*
zp120Z: zoom in/out
zp120B: block
zp120U: uploading

*/