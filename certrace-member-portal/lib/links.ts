/* ════════════════════════════════════════════════════════════
   OUTBOUND LINKS — the public Certrace presence, in one place

   Every URL here points OUTSIDE the portal, which is exactly why they are
   collected rather than typed at each call site: a moved LINE account or a
   renamed legal page is one edit, and a typo in a social handle is a dead
   link on the one screen a brand-new customer sees.

   The legal pages are the PUBLISHED documents on certrace.co, not the in-app
   /legal/* copies — someone consenting on the sign-up form must be able to
   read what they are agreeing to without an account, and a link that only
   resolves behind the login is not that.
   ════════════════════════════════════════════════════════════ */

/* The public site. The auth screens' top-left wordmark points here: a visitor
   on /login has no session, so the only "home" that exists for them is the
   marketing site they arrived from. */
export const MARKETING_SITE_URL = "https://certrace.co/";

export const LEGAL_TERMS_URL = "https://certrace.co/terms";
export const LEGAL_PRIVACY_URL = "https://certrace.co/privacy";

/* LINE is the support channel, not a social profile — the CBAM specialists
   answer there, which is why it is the primary action on the sign-up
   completion page while the other four are secondary. A Thai exporter stuck
   on a field at 9pm messages on LINE; they do not fill in a web form. */
export const SOCIAL_LINE_URL = "https://lin.ee/P76yqsw";
export const SOCIAL_LINKEDIN_URL = "https://www.linkedin.com/company/certrace-co";
export const SOCIAL_FACEBOOK_URL = "https://www.facebook.com/certrace";
export const SOCIAL_INSTAGRAM_URL = "https://www.instagram.com/certrace";
export const SOCIAL_YOUTUBE_URL = "https://www.youtube.com/@Certrace";

/* The walkthrough. One video, linked from the account menu above "Report a
   problem" — an exporter who cannot find where a month is entered wants to be
   shown, not to open a support thread and wait. YouTube rather than an
   in-app tour so it can be watched on a phone while the portal stays open on
   the desktop. */
export const GUIDE_VIDEO_URL = "https://youtu.be/l4ZdQq5KA7Q?si=y0NoQGy5Fsl4mt2r";

/* "I want the product to do something it does not do." A DIFFERENT ERRAND
   from "Report a problem", which is why it is a separate row rather than one
   more thing to type into the support thread: a problem is something broken
   in front of the person right now and belongs on LINE where a specialist
   answers within the hour, while a feature request is a note to the roadmap
   and belongs on the public site, where it is read alongside what is already
   planned. Put ABOVE "Report a problem" in the account menu, following the
   same rule the guide video does — the row that is cheaper for both sides
   comes first. */
export const FEATURE_REQUEST_URL = "https://certrace.co";
