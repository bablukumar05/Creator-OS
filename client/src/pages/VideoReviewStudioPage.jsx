import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  AlertCircle,
  Plus,
  Trash2,
  Brush,
  Maximize2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewApi, service } from '../services/api';
import { Button, Badge, Loading } from '../components/ui';

const SAMPLE_DEMO_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

// format raw playback seconds into mm:ss display format
function formatTime(seconds) {
  const s = Math.floor(seconds || 0);
  const mins = Math.floor(s / 60).toString().padStart(2, '0');
  const secs = (s % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function VideoReviewStudioPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSpeed, setActiveSpeed] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState('Pending');
  const [actionBusy, setActionBusy] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [filterResolved, setFilterResolved] = useState('all');
  const [contentList, setContentList] = useState([]);
  const [selectedContentId, setSelectedContentId] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [selectedContentId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await service.list('content', { limit: 20 });
      const items = res.items || [];
      setContentList(items);
      if (items.length > 0) {
        setSelectedContentId(items[0]._id);
      }
    } catch {
      toast.error('Failed to load content list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await reviewApi.list(selectedContentId ? { contentId: selectedContentId } : {});
      setReviews(data.items || []);
    } catch {
      toast.error('Failed to load review comments.');
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      setDrawingMode(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 60);
  };

  const seekTo = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    setCurrentTime(seconds);
    if (!isPlaying) {
      videoRef.current.pause();
    }
  };

  const skipSeconds = (offset) => {
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(duration, videoRef.current.currentTime + offset));
    seekTo(target);
  };

  const changeSpeed = (rate) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setActiveSpeed(rate);
  };

  const startCanvasDrawing = (e) => {
    if (!drawingMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawing.current = true;
  };

  const drawOnCanvas = (e) => {
    if (!isDrawing.current || !drawingMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#ef4444';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopCanvasDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvasOverlay = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error('Please enter a feedback comment.');
      return;
    }

    try {
      setActionBusy(true);
      const timestamp = Math.round(currentTime * 10) / 10;
      await reviewApi.create({
        contentId: selectedContentId || undefined,
        comment: newComment,
        timestamp,
        timecodeFormatted: formatTime(timestamp),
        status: newStatus,
      });

      toast.success(`Feedback saved at ${formatTime(timestamp)}!`);
      setNewComment('');
      clearCanvasOverlay();
      setDrawingMode(false);
      await fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit comment.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleToggleResolve = async (reviewId) => {
    try {
      await reviewApi.toggleResolve(reviewId);
      toast.success('Comment status updated.');
      await fetchReviews();
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewApi.remove(reviewId);
      toast.success('Feedback note removed.');
      await fetchReviews();
    } catch {
      toast.error('Failed to remove review.');
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterResolved === 'unresolved') return !r.resolved;
    if (filterResolved === 'resolved') return r.resolved;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#2b5341] text-white">
              <Clock size={14} />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2b5341]">
              Level 4 Enterprise Studio
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink mt-1">
            Timecoded Video Review Studio
          </h1>
          <p className="text-xs text-muted max-w-2xl">
            Frame-accurate collaborative video review. Clients and creators drop feedback notes at exact seconds with drawing markup and resolve tracking.
          </p>
        </div>

        {contentList.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted font-medium">Select Video:</label>
            <select
              className="input text-xs w-auto max-w-[220px]"
              value={selectedContentId}
              onChange={(e) => setSelectedContentId(e.target.value)}
            >
              {contentList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-3">
          <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden shadow-lg border border-line">
            <video
              ref={videoRef}
              src={SAMPLE_DEMO_VIDEO}
              className="h-full w-full object-contain cursor-pointer"
              onClick={togglePlay}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />

            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className={`absolute inset-0 h-full w-full ${
                drawingMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
              }`}
              onMouseDown={startCanvasDrawing}
              onMouseMove={drawOnCanvas}
              onMouseUp={stopCanvasDrawing}
              onTouchStart={startCanvasDrawing}
              onTouchMove={drawOnCanvas}
              onTouchEnd={stopCanvasDrawing}
            />

            {drawingMode && (
              <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow backdrop-blur-xs flex items-center gap-1.5 animate-pulse">
                <Brush size={12} /> Drawing Mode Active (Click & Drag on Video)
              </div>
            )}
          </div>

          <div className="card p-3 space-y-2">
            <div className="relative w-full h-3 bg-canvas rounded-full cursor-pointer flex items-center group">
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="w-full h-2 accent-[#2b5341] cursor-pointer"
              />

              {reviews.map((r) => {
                const pct = Math.min(100, Math.max(0, ((r.timestamp || 0) / (duration || 1)) * 100));
                return (
                  <button
                    key={r._id}
                    type="button"
                    onClick={() => seekTo(r.timestamp)}
                    style={{ left: `${pct}%` }}
                    className={`absolute top-0 bottom-0 w-2 rounded-full transform -translate-x-1/2 transition-transform hover:scale-150 z-10 ${
                      r.resolved ? 'bg-emerald-500' : 'bg-red-500 ring-2 ring-white'
                    }`}
                    title={`[${r.timecodeFormatted}] ${r.comment}`}
                  />
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-2 rounded-xl bg-[#2b5341] text-white hover:bg-[#234435] transition-colors"
                >
                  {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <button
                  type="button"
                  onClick={() => skipSeconds(-5)}
                  className="icon-btn h-8 w-8 text-muted hover:text-ink"
                  title="Rewind 5s"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => skipSeconds(5)}
                  className="icon-btn h-8 w-8 text-muted hover:text-ink"
                  title="Forward 5s"
                >
                  <RotateCw size={14} />
                </button>
                <span className="font-mono text-xs text-ink font-semibold ml-2">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (isPlaying) togglePlay();
                    setDrawingMode(!drawingMode);
                  }}
                  className={`btn text-xs py-1 px-2.5 ${
                    drawingMode ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  <Brush size={12} /> {drawingMode ? 'Close Brush' : 'Draw Markup'}
                </button>

                {drawingMode && (
                  <button
                    type="button"
                    onClick={clearCanvasOverlay}
                    className="btn btn-secondary text-xs py-1 px-2 text-muted"
                  >
                    Clear
                  </button>
                )}

                <div className="flex items-center border border-line rounded-lg overflow-hidden bg-canvas">
                  {[1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => changeSpeed(rate)}
                      className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                        activeSpeed === rate ? 'bg-[#2b5341] text-white' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen();
                    }
                  }}
                  className="icon-btn h-8 w-8 text-muted hover:text-ink hidden sm:inline-flex"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleAddComment} className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-ink flex items-center gap-1.5">
                <Plus size={14} className="text-[#2b5341]" /> Drop Note at Frame {formatTime(currentTime)}
              </span>
              <div className="flex items-center gap-2">
                <select
                  className="input text-[11px] py-1 w-auto"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="Pending">General Note</option>
                  <option value="Changes Requested">Changes Requested</option>
                  <option value="Approved">Compliment / Approved</option>
                </select>
              </div>
            </div>

            <textarea
              rows={2}
              className="input text-xs"
              placeholder={`e.g. Cut background music volume at ${formatTime(currentTime)} and punch in on product...`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />

            <div className="flex justify-end gap-2">
              <Button variant="primary" type="submit" className="text-xs py-1.5 px-3" loading={actionBusy}>
                <Send size={12} /> Post Frame Note
              </Button>
            </div>
          </form>
        </div>

        <div className="card p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-1.5">
                <MessageSquare size={15} className="text-[#2b5341]" />
                <h3 className="font-semibold text-xs text-ink">
                  Timecoded Notes ({reviews.length})
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                {['all', 'unresolved', 'resolved'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilterResolved(f)}
                    className={`px-2 py-0.5 rounded capitalize transition-all ${
                      filterResolved === f
                        ? 'bg-[#2b5341] text-white font-medium'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <Loading />
            ) : filteredReviews.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-xs text-muted">
                <Clock size={28} className="mx-auto text-muted/60" />
                <p>No feedback notes found for this filter.</p>
                <p className="text-[11px]">Pause the video at any frame to post an annotated comment.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredReviews.map((r) => (
                  <div
                    key={r._id}
                    className={`p-3 rounded-xl border transition-all text-xs space-y-1.5 ${
                      r.resolved ? 'bg-canvas/50 border-line/60 opacity-70' : 'bg-white border-line shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => seekTo(r.timestamp)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-mono font-bold text-[10px] hover:bg-emerald-100 transition-colors"
                      >
                        <Clock size={10} /> {r.timecodeFormatted || formatTime(r.timestamp)}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <Badge>{r.status}</Badge>
                        <button
                          type="button"
                          onClick={() => handleToggleResolve(r._id)}
                          className={`icon-btn h-6 w-6 ${
                            r.resolved ? 'text-emerald-700' : 'text-muted hover:text-emerald-700'
                          }`}
                          title={r.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                        >
                          <CheckCircle2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(r._id)}
                          className="icon-btn h-6 w-6 text-muted hover:text-red-600"
                          title="Delete Note"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <p
                      className={`text-ink leading-relaxed ${
                        r.resolved ? 'line-through text-muted' : ''
                      }`}
                    >
                      {r.comment}
                    </p>

                    <p className="text-[10px] text-muted flex items-center justify-between pt-0.5">
                      <span>{r.authorName || r.reviewerId?.name || 'Reviewer'}</span>
                      {r.resolved && <span className="text-emerald-800 font-medium">✓ Resolved</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-canvas border border-line text-[11px] text-muted space-y-1">
            <p className="font-semibold text-ink flex items-center gap-1">
              <AlertCircle size={12} className="text-[#2b5341]" /> Pro Review Tip
            </p>
            <p>Click on any timestamp badge above to instantly jump the video to that exact second.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { VideoReviewStudioPage as VideoReviewStudio };
