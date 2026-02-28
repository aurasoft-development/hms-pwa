import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi/bookingApi';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { useFormStore } from '../store/formStore';
import { Star, Send, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import toast from 'react-hot-toast';

export default function ReviewPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const hotelId = searchParams.get('hotelId');

    const { setFormData: setPersistentData, clearFormData, getFormData } = useFormStore();

    // Form State with Persistence
    const initialForm = {
        rating: 0,
        userName: '',
        comment: '',
    };
    const persistenceKey = `review_${token || hotelId}`;

    const [formData, setFormData] = useState(() => getFormData(persistenceKey, initialForm));
    const { rating, userName, comment } = formData;

    const [hover, setHover] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fetchingHotel, setFetchingHotel] = useState(false);
    const [hotelData, setHotelData] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [googleLink, setGoogleLink] = useState('');

    useEffect(() => {
        if (token || hotelId) {
            setPersistentData(persistenceKey, formData);
        }
    }, [formData, persistenceKey, setPersistentData, token, hotelId]);

    const setRating = (val) => setFormData(prev => ({ ...prev, rating: val }));
    const setUserName = (val) => setFormData(prev => ({ ...prev, userName: val }));
    const setComment = (val) => setFormData(prev => ({ ...prev, comment: val }));

    useEffect(() => {
        if (hotelId) {
            fetchHotelDetails();
        }
    }, [hotelId]);

    const fetchHotelDetails = async () => {
        setFetchingHotel(true);
        try {
            const response = await hotelManagementApi.getHotelById(hotelId);
            setHotelData(response.data || response);
        } catch (error) {
            console.error('Failed to fetch hotel details:', error);
        } finally {
            setFetchingHotel(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userName.trim()) {
            toast.error('Please enter your name');
            return;
        }
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setLoading(true);
        try {
            let response;
            if (token) {
                response = await bookingApi.submitReviewWithToken({
                    token,
                    userName,
                    rating,
                    comment
                });
            } else if (hotelId) {
                response = await bookingApi.submitReviewWithHotelId({
                    hotelId,
                    userName,
                    rating,
                    comment
                });
            }

            toast.success(response?.message || 'Feedback submitted successfully');
            clearFormData(persistenceKey);

            if (response?.shouldRedirectToGoogle && response?.googleReviewLink) {
                setTimeout(() => {
                    window.location.href = response.googleReviewLink;
                }, 1500);
                return;
            }

            setSubmitted(true);
            if (response?.googleReviewLink) {
                setGoogleLink(response.googleReviewLink);
            }
        } catch (error) {
            toast.error(error?.message || error || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    if (!token && !hotelId) {
        return (
            <div className="h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans overflow-hidden">
                <Card className="max-w-md w-full p-6 text-center bg-white border border-slate-200 shadow-sm rounded-2xl">
                    <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-slate-400 text-sm">!</span>
                    </div>
                    <h2 className="text-base font-semibold text-slate-900 mb-0.5 tracking-tight">Access Expired</h2>
                    <p className="text-slate-500 text-[10px]">This review link is no longer active.</p>
                </Card>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans overflow-hidden">
                <Card className="max-w-md w-full p-8 text-center bg-white border border-slate-200 shadow-xl rounded-[2rem] animate-in fade-in zoom-in duration-500">
                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Thank You</h2>
                    <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                        We appreciate you taking the time to share your feedback about <span className="text-slate-900 font-semibold">{hotelData?.name || 'your stay'}</span>.
                    </p>

                    {googleLink && (
                        <div className="pt-4 border-t border-slate-100">
                            <p className="text-slate-400 text-[10px] mb-3">
                                Post this review to our Google page.
                            </p>
                            <a
                                href={googleLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-6 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-md group text-xs"
                            >
                                Post to Google
                                <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                            </a>
                        </div>
                    )}
                </Card>
            </div>
        );
    }

    const ratingLabels = {
        1: 'could be better',
        2: 'fair',
        3: 'good',
        4: 'exceptional',
        5: 'absolute perfection'
    };

    return (
        <div className="h-screen bg-white text-slate-900 font-sans antialiased selection:bg-slate-100 flex flex-col items-center justify-center overflow-hidden">
            <main className="w-full max-w-xl px-6 py-2 flex flex-col items-center">
                <div className="w-full space-y-4 flex flex-col items-center">
                    {/* Brand & Lead */}
                    <div className="space-y-2 text-center w-full max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-1000">
                        {hotelData?.logo ? (
                            <img src={hotelData.logo} alt="Hotel Logo" className="h-6 object-contain grayscale opacity-60 mx-auto" />
                        ) : (
                            <div className="w-8 h-8 bg-[#0F172A] rounded flex items-center justify-center shadow-lg mx-auto">
                                <Star className="w-4 h-4 text-white fill-current" />
                            </div>
                        )}

                        <div className="space-y-0.5">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
                                How was your stay at {fetchingHotel ? '...' : hotelData?.name || 'our hotel'}?
                            </h1>
                            <p className="text-slate-500 text-[10px] font-medium leading-relaxed max-w-xs mx-auto opacity-70">
                                Your feedback helps us improve. This review will be shared with our management and guests.
                            </p>
                        </div>
                    </div>

                    {/* Review Form Card */}
                    <div className="w-full bg-white border border-slate-100 rounded-[1.5rem] p-4 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col items-center">
                        <form onSubmit={handleSubmit} className="w-full space-y-4 flex flex-col items-center">
                            {/* Star Rating */}
                            <div className="space-y-2 w-full flex flex-col items-center">
                                <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 block text-center">Score your experience</label>
                                <div className="flex flex-col items-center gap-0.5">
                                    <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className="p-1 sm:p-1.5 transition-transform active:scale-95 focus:outline-none"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHover(star)}
                                                onMouseLeave={() => setHover(0)}
                                            >
                                                <Star
                                                    className={`w-7 h-7 sm:w-9 sm:h-9 transition-all duration-200 ${star <= (hover || rating)
                                                            ? 'fill-[#0F172A] text-[#0F172A]'
                                                            : 'text-slate-200 fill-transparent stroke-[1.2]'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="h-3">
                                        {rating > 0 && (
                                            <span className="text-[9px] font-bold text-slate-900 lowercase tracking-tight animate-in fade-in zoom-in duration-300">
                                                — {ratingLabels[hover || rating]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Inputs */}
                            <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
                                <div className="space-y-1 group">
                                    <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400 pl-1">Guest Name</label>
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        placeholder="Full Name"
                                        className="w-full bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-slate-900 text-xs font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0F172A]/5 focus:bg-white focus:border-slate-100 transition-all"
                                        required
                                    />
                                </div>

                                <div className="space-y-1 group">
                                    <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400 pl-1">Details</label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Standout moments..."
                                        rows={2}
                                        className="w-full bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-slate-900 text-xs font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0F172A]/5 focus:bg-white focus:border-slate-100 transition-all resize-none leading-relaxed"
                                    />
                                </div>
                            </div>

                            {/* Submission Area */}
                            <div className="pt-1 flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
                                <Button
                                    type="submit"
                                    className="w-full h-9 text-[9px] font-bold uppercase tracking-widest rounded-lg bg-[#0F172A] text-white hover:bg-slate-800 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                    loading={loading}
                                    disabled={loading || rating === 0}
                                >
                                    {loading ? 'Submitting...' : 'Send Review'}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="w-full sm:w-auto px-6 h-9 text-[8px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Footer Info */}
                    <div className="flex flex-col items-center gap-1 opacity-40">
                        <div className="flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-[0.2em] text-slate-200">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Verified Feedback</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
