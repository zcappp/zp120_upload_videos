import React from "react"
import css from "./zp120_批量上传视频.css"

function render(ref) {
     let { props } = ref
    let arr = gets(ref)
    return <React.Fragment>
        {arr.map((a, i) => <div className="zp120B zp120Z" onClick={() => preview(ref, a)} key={a + i}>
            <video src={a}/>
            <i onClick={e => {e.stopPropagation(); ref.exc('confirm("确定要删除吗？")', {}, () => {arr.splice(i, 1); ref.form ? ref.form[props.dbf] = arr : ref.setForm(props.dbf, arr); ref.exc('render()')})}} className="zdel zp120del"/>
            <i className="zmove zp120handler"/>
        </div>)}
        {ref.ing.map((a, i) => <div className={"zp120B zp120_" + i + " zp120U"} onClick={() => preview(ref, a)} key={a + i}>
            <div className="zp120progress"/>
            <video src={a}/>
        </div>)}
        <div className="zp120B">
            <div className={props.noLabel ? "zp120noLabel" : ""}><span className="zvideo"><span/></span><label>{props.noLabel ? "" : (props.label || "上传视频")}</label></div>
            <input onChange={e => onChange(ref, e)} type="file" accept="video/*" multiple="multiple"/>
            {!!props.url && <span className="zp120url" onClick={() => popUrl(ref)}>URL</span>}
            {ref.modal}
        </div>
        <div style={{display: "none"}}/>
    </React.Fragment>
}

function init(ref) {
    const { id, exc, props, render } = ref
    ref.ing = []
    exc('load("//z.zccdn.cn/vendor/Sortable_1.13.0.js")', {}, () => {
        new Sortable(ref.container, {
            animation: 150,
            forceFallback: true,
            fallbackTolerance: 5,
            onSort: e => {
                let arr = gets(ref)
                arr.splice(e.newDraggableIndex, 0, arr.splice(e.oldDraggableIndex, 1)[0])
                ref.form ? ref.form[props.dbf] = arr : ref.setForm(props.dbf, arr)
            },
            handle: "#" + id + " .zp120handler",
            draggable: ".zp120Z",
            dragClass: "zp120Drag",
            ghostClass: "zp120Drop"
        })
    })
}

function gets(ref) {
    let { dbf, form } = ref.props
    let arr
    if (form) {
        ref.form = typeof form == "string" ? ref.excA(form) : form
        if (typeof ref.form == "object") arr = ref.form[dbf]
    } else if (ref.getForm) {
        arr = ref.getForm(dbf)
    }
    return Array.isArray(arr) ? arr : []
}

function onChange(ref, e) {
    const { exc, render, props } = ref
    const arr = Array.from(e.target.files)
    if (!arr.length) return exc('warn("请选择视频")')
    if (arr.find(a => a.size / 1048576 > (props.max || 900))) return exc(`warn("文件太大, 请压缩至${props.max || 900}M以下")`)
    arr.forEach((file, i) => setTimeout(() => {
        const x = URL.createObjectURL(file)
        ref.ing.push(x)
        render()
        exc('upload(file, option)', {
            file,
            option: {
                onProgress: r => {
                    $("#" + ref.id + " .zp120_" + ref.ing.indexOf(x) + " .zp120progress").innerHTML = r.percent + "%"
                },
                onSuccess: r => {
                    let { props } = ref
                    preload(r.url, ref.container, () => {
                        ref.ing.splice(ref.ing.indexOf(x), 1)
                        URL.revokeObjectURL(x)
                        ref.form ? ref.form[props.dbf].push(r.url) : ref.setForm(props.dbf, gets(ref).concat([r.url]))
                        if (props.onSuccess) exc(props.onSuccess, { ...ref.ctx, $ext_ctx: ref.ctx, $val: gets(ref).concat([r.url]), ...r }, () => ref.exc("render()"))
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

function preload(url, container, onload) {
    let el = document.createElement(url.endsWith("mp4") ? "img" : "video")
    el.src = url.endsWith("mp4") ? url + "?x-oss-process=video/snapshot,m_fast,t_5000,w_0,ar_auto" : url
    url.endsWith("mp4") ? el.onload = onload : el.onloadstart = onload
    el.onerror = onload
    container.lastElementChild.appendChild(el)
}

function popUrl(ref) {
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
            arr = [...gets(ref), ...arr]
            ref.form ? ref.form[ref.props.dbf] = arr : ref.setForm(ref.props.dbf, arr)
            exc('render()')
        }
    })
}

$plugin({
    id: "zp120",
    props: [{
        prop: "dbf",
        label: "字段名",
        ph: "必填"
    }, {
        prop: "form",
        label: "字段容器",
        ph: "如不填则使用祖先节点的表单容器"
    }, {
        prop: "max",
        type: "number",
        label: "最大文件大小(单位:MB)",
        ph: "默认最大900MB"
    }, {
        prop: "noLabel",
        type: "switch",
        label: "不显示文本"
    }, {
        prop: "label",
        label: "[上传文件] 文本",
        show: "!P.noLabel"
    }, {
        prop: "url",
        type: "switch",
        label: "允许通过URL上传"
    }, {
        prop: "onSuccess",
        type: "exp",
        label: "上传成功表达式",
        ph: "$val"
    }],
    render,
    init,
    css
})


/*
zp120Z: zoom in/out
zp120B: block
zp120U: uploading

*/