"use client"

import { useEffect, useRef, useState, type FormEvent, type DragEvent } from "react"
import { ArrowDown, ArrowUpRight, Check, Plus, X } from "lucide-react"
import { collectDemoFiles, DEMO_ACCEPT, DEMOS_CLOSED_MESSAGE, demoFileSize, EMPTY_DEMO_DETAILS, MAX_DEMO_FILES, validDemoDetails, validDemoEmail, type DemoDetails, type DemoTrack } from "@/lib/demo-submission"
import { uploadDemoBatch, type DemoUploadProgress } from "@/lib/demo-upload"
import styles from "./collecting-dots-demos.module.css"

type Turnstile = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void; reset: (id: string) => void }
const turnstile = () => (window as Window & { turnstile?: Turnstile }).turnstile
const initialProgress: DemoUploadProgress = { step: "idle", percent: 0, index: 0, name: "" }
const stepLabel = { idle: "Ready", verifying: "Verifying", getting_link: "Preparing upload", uploading: "Uploading", confirming: "Saving your demo" }

export default function DemoSubmissionForm({ open, onClose, incoming, loading, enabled }: { open: boolean; onClose: () => void; incoming: File[]; loading: boolean; enabled: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null), inputRef = useRef<HTMLInputElement>(null), widgetRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null), tokenRef = useRef<string | null>(null), uploadingRef = useRef(false)
  const pendingToken = useRef<{ resolve: (token: string) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> } | null>(null)
  const [tracks, setTracks] = useState<DemoTrack[]>([]), [details, setDetails] = useState<DemoDetails>(EMPTY_DEMO_DETAILS)
  const [fileError, setFileError] = useState(""), [error, setError] = useState(""), [verificationError, setVerificationError] = useState("")
  const [token, setToken] = useState<string | null>(null), [busy, setBusy] = useState(false), [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(initialProgress), [receipt, setReceipt] = useState<{ demoId?: string; count: number } | null>(null)
  const hasTracks = tracks.length > 0, received = Boolean(receipt)
  const lastIncoming = useRef<File[] | null>(null)
  const setVerification = (value: string | null) => { tokenRef.current = value; setToken(value) }
  function addFiles(files: File[]) {
    if (uploadingRef.current) return
    const result = collectDemoFiles(files, receipt ? 0 : tracks.length)
    if (receipt) { setReceipt(null); setDetails(EMPTY_DEMO_DETAILS) }
    setFileError(result.error); setTracks(current => [...(receipt ? [] : current), ...result.accepted])
    setError("")
  }
  useEffect(() => { if (incoming.length && incoming !== lastIncoming.current) { lastIncoming.current = incoming; addFiles(incoming) } }, [incoming])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
    if (!open) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = overflow }
  }, [open])

  useEffect(() => {
    if (!open || !enabled || loading || !hasTracks || received) return
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!sitekey) { setVerificationError("Verification is unavailable. Please try again later."); return }
    let disposed = false
    setVerificationError(""); setVerification(null)
    const rejectPending = (message: string) => {
      const pending = pendingToken.current
      if (pending) { clearTimeout(pending.timer); pendingToken.current = null; pending.reject(new Error(message)) }
    }
    const init = () => {
      const api = turnstile()
      if (disposed || widgetId.current || !api || !widgetRef.current) return
      try {
        widgetId.current = api.render(widgetRef.current, { sitekey, theme: "light", size: "compact",
          callback: (value: string) => {
            if (disposed) return
            setVerification(value); setVerificationError("")
            const pending = pendingToken.current
            if (pending) { clearTimeout(pending.timer); pendingToken.current = null; pending.resolve(value) }
          },
          "error-callback": () => { if (!disposed) { setVerification(null); setVerificationError("Verification failed. Please try again."); rejectPending("Verification failed. Please try again.") } },
          "expired-callback": () => { if (!disposed) { setVerification(null); setVerificationError("Verification expired. Please verify again.") } },
        })
      } catch { setVerificationError("Verification is unavailable. Please try again later.") }
    }
    init()
    const interval = setInterval(init, 200)
    const timeout = setTimeout(() => { clearInterval(interval); if (!widgetId.current && !disposed) setVerificationError("Verification couldn't load. Please reopen this form and try again.") }, 10000)
    return () => {
      disposed = true; clearInterval(interval); clearTimeout(timeout); rejectPending("Verification was interrupted.")
      if (widgetId.current) { try { turnstile()?.remove(widgetId.current) } catch {} }
      widgetId.current = null; tokenRef.current = null; setToken(null)
    }
  }, [open, enabled, loading, hasTracks, received])

  const freshToken = async (index: number) => {
    if (index === 0 && tokenRef.current) return tokenRef.current
    const api = turnstile(), id = widgetId.current
    if (!api || !id) throw new Error("Please verify again before sending your tracks.")
    setVerification(null)
    // Each upload-link request validates its own single-use Turnstile token.
    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => { pendingToken.current = null; reject(new Error("Verification timed out. Please try again.")) }, 120000)
      pendingToken.current = { resolve, reject, timer }
      try { api.reset(id) } catch { clearTimeout(timer); pendingToken.current = null; reject(new Error("Please verify again.")) }
    })
  }
  const valid = enabled && !loading && hasTracks && tracks.every(track => track.trackTitle.trim() && track.trackTitle.length <= 100) && validDemoDetails(details) && Boolean(token) && !fileError && !verificationError
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!valid || uploadingRef.current) return
    uploadingRef.current = true; setBusy(true); setError("")
    try { setReceipt(await uploadDemoBatch({ tracks: tracks.map(track => ({ ...track, trackTitle: track.trackTitle.trim() })), details: Object.fromEntries(Object.entries(details).map(([name, value]) => [name, value.trim()])) as DemoDetails, getToken: freshToken, onProgress: setProgress })) }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Your submission couldn't be completed. Please try again.") }
    finally {
      uploadingRef.current = false; setBusy(false); setProgress(initialProgress); setVerification(null)
      if (widgetId.current) { try { turnstile()?.reset(widgetId.current) } catch {} }
    }
  }
  function drop(event: DragEvent) { event.preventDefault(); setDragging(false); if (enabled && !busy) addFiles(Array.from(event.dataTransfer.files)) }
  function remove(index: number) { setTracks(current => current.filter((_, position) => position !== index)); setFileError(""); setError("") }
  function reset() { setTracks([]); setDetails(EMPTY_DEMO_DETAILS); setReceipt(null); setError(""); setFileError(""); setVerificationError(""); setProgress(initialProgress) }
  function field(name: keyof DemoDetails, label: string, placeholder: string, required = false, type = "text") {
    const invalid = name === "email" && Boolean(details.email) && !validDemoEmail(details.email)
    return <div className={styles.field}><label htmlFor={`demo-${name}`}>{label}{required && <span> *</span>}</label><input id={`demo-${name}`} name={name} type={type} required={required} autoComplete={name === "fullName" ? "name" : name === "email" ? "email" : "off"} maxLength={name === "artistName" ? 100 : undefined} placeholder={placeholder} value={details[name]} onChange={event => setDetails(current => ({ ...current, [name]: event.target.value }))} aria-invalid={invalid || undefined} aria-describedby={invalid ? "demo-email-error" : undefined} />{invalid && <p id="demo-email-error" className={styles.error}>Please enter a valid email address.</p>}</div>
  }

  return <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="demo-dialog-title" onClose={onClose} onCancel={event => { if (busy) event.preventDefault(); else onClose() }} onClick={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <div className={styles.dialogControls}><button className={styles.close} onClick={onClose} disabled={busy} aria-label="Close demo submission" autoFocus><X size={22} /></button></div>
    <div className={styles.dialogLayout}>
      <aside className={styles.formAside}><p className={styles.micro}>Collecting Dots Records / Demos</p><h2 id="demo-dialog-title"><span>DROP </span><span>YOUR </span><span>DOT<i>.</i></span></h2><p>Your sound.<br />Our next discovery.</p><ol className={styles.formSteps}><li data-done={hasTracks}><span>{hasTracks ? <Check size={13} /> : "01"}</span>Your tracks</li><li data-done={validDemoDetails(details)}><span>{validDemoDetails(details) ? <Check size={13} /> : "02"}</span>About you</li><li data-done={received}><span>{received ? <Check size={13} /> : "03"}</span>Into the collection</li></ol><span className={styles.asideDot} aria-hidden="true" /></aside>
      <div className={styles.formPane}>
        {loading ? <div className={styles.notice} role="status"><p className={styles.micro}>One moment</p><h3>Checking the inbox.</h3></div> : !enabled ? <div className={styles.notice}><p className={styles.micro}>The inbox is taking a breather</p><h3>Back for more soon.</h3><p>{DEMOS_CLOSED_MESSAGE}</p></div> : receipt ? <div className={styles.receipt} role="status"><span className={styles.receivedDot}><Check size={30} /></span><p className={styles.micro}>Submission received</p><h3>YOUR DOT<br />IS IN.</h3><p>{receipt.count} {receipt.count === 1 ? "track" : "tracks"} received. Thank you for sharing your sound with Collecting Dots.</p>{receipt.demoId && <div className={styles.receiptId}><span>Your reference</span><strong>{receipt.demoId}</strong></div>}<button className={styles.send} onClick={reset}>Send another demo<ArrowUpRight size={19} /></button></div> : <form onSubmit={submit} aria-label="Demo submission" aria-busy={busy}>
          <input ref={inputRef} type="file" accept={DEMO_ACCEPT} multiple hidden aria-label="Choose demo audio files" onChange={event => { addFiles(Array.from(event.target.files || [])); event.target.value = "" }} />
          <fieldset disabled={busy} className={styles.formFields}>
            <div className={styles.formSectionTitle}><h3>Your tracks</h3><span>{String(tracks.length).padStart(2, "0")} / 10</span></div>
            {!hasTracks ? <div className={styles.dropzone} data-dragging={dragging} onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={drop}><span className={styles.dropIcon}><ArrowDown size={29} /></span><h4>A new dot starts here.</h4><p>Drop your tracks or choose your files.</p><button type="button" className={styles.choose} onClick={() => inputRef.current?.click()}>Choose your tracks<Plus size={17} /></button><small>MP3 or WAV · Up to 10 tracks · 150 MB each</small></div> : <><div className={styles.trackList}>{tracks.map((track, index) => <div className={styles.trackRow} key={`${track.file.name}-${track.file.lastModified}-${index}`}><span className={styles.trackNumber}>{String(index + 1).padStart(2, "0")}</span><div><label htmlFor={`demo-track-${index}`}>Track title *</label><input id={`demo-track-${index}`} value={track.trackTitle} required maxLength={100} onChange={event => setTracks(current => current.map((item, position) => position === index ? { ...item, trackTitle: event.target.value } : item))} /><p title={track.file.name}>{track.file.name}<span>{demoFileSize(track.file.size)}</span></p></div><button type="button" onClick={() => remove(index)} aria-label={`Remove ${track.file.name}`}><X size={16} /></button></div>)}</div><div className={styles.trackActions}><button type="button" disabled={tracks.length >= MAX_DEMO_FILES} onClick={() => inputRef.current?.click()}><Plus size={15} />Add tracks</button><button type="button" onClick={() => { setTracks([]); setFileError(""); setError("") }}>Clear all</button></div></>}
            {fileError && <p className={styles.error} role="alert">{fileError}<button type="button" onClick={() => setFileError("")}>Dismiss</button></p>}
            {hasTracks && <><div className={styles.formSectionTitle}><h3>About you</h3><span>* Required</span></div><div className={styles.fieldsGrid}>{field("artistName", "Artist name", "The name behind the music", true)}{field("fullName", "Full name", "Your full name", true)}{field("email", "Email", "you@example.com", true, "email")}{field("instagram", "Instagram", "@yourname or profile URL", true)}</div><details className={styles.optional}><summary>More places to find you<span>Optional +</span></summary><div className={styles.fieldsGrid}>{field("beatport", "Beatport", "Profile URL")}{field("facebook", "Facebook", "Page URL")}{field("x", "X / Twitter", "Profile URL")}</div></details><div className={styles.verification}><p className={styles.micro}>A quick verification</p><div ref={widgetRef} />{verificationError && <p className={styles.error} role="alert">{verificationError}</p>}</div></>}
          </fieldset>
          {busy && <div className={styles.uploadProgress} role="status" aria-live="polite"><div><span>{stepLabel[progress.step]} · {progress.index}/{tracks.length}</span><strong>{progress.percent}%</strong></div><progress value={progress.percent} max={100} aria-label="Demo upload progress" /><p>{progress.name}</p><small>Please keep this window open while your music uploads.</small></div>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {hasTracks && <><button className={styles.send} type="submit" disabled={!valid || busy}>{busy ? `${stepLabel[progress.step]}…` : "Drop your dot"}<ArrowUpRight size={20} /></button><p className={styles.formFootnote}>Your music goes straight to the Collecting Dots demo inbox.</p></>}
        </form>}
      </div>
    </div>
  </dialog>
}
