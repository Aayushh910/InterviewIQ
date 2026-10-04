"""
Report Service for InterviewIQ (Phase 13).
Generates professional, print-friendly, high-fidelity candidate interview reports
in PDF format using ReportLab.
Strictly relies on Phase 12 FinalEvaluation and ResultsService DTO.
Does not recalculate scores or expose private database identifiers.
"""

import io
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas

from app.models.interview_session import InterviewSession
from app.models.interview import Interview
from app.models.final_evaluation import FinalEvaluation
from app.evaluation.exceptions import (
    SessionNotFoundError,
    UnauthorizedEvaluationError,
    EvaluationNotFoundError,
)
from app.services.results_service import results_service
from app.schemas.results import CandidateResultsDTO

logger = logging.getLogger(__name__)

REPORT_VERSION = "1.0"


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas that accumulates total page count and prints
    consistent running headers and footers with accurate 'Page X of Y' pagination.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Running Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, 756, "InterviewIQ — Candidate Performance Report")
            self.drawRightString(576, 756, f"Report v{REPORT_VERSION}")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(36, 750, 576, 750)

        # Running Footer (all pages)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(36, 38, 576, 38)

        self.drawString(36, 26, "InterviewIQ Confidential Evaluation • Deterministic AI Assessment")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 26, page_str)

        self.restoreState()


class ReportService:
    """
    Server-side deterministic PDF report generation service.
    """

    @classmethod
    def generate_pdf_report(
        cls,
        db: Session,
        session_id: str,
        user_id: str,
    ) -> bytes:
        """
        Generate a validated, beautifully formatted PDF report for an interview session.
        Enforces user ownership, session existence, and evaluation existence.
        Returns the raw PDF binary bytes.
        """
        # Retrieve candidate-facing DTO (already verifies authorization and evaluation existence)
        results_dto = results_service.get_candidate_results(db=db, session_id=session_id, user_id=user_id)

        # Compile PDF via ReportLab
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=46,
            bottomMargin=46,
            title=f"InterviewIQ Report - {results_dto.interview_title}",
            author="InterviewIQ AI Platform",
        )

        story = []
        styles = cls._build_stylesheet()

        # 1. Header & Branding Banner
        story.extend(cls._build_header(results_dto, styles))
        story.append(Spacer(1, 10))

        # 2. Executive Score Summary Banner
        story.extend(cls._build_executive_score_card(results_dto, styles))
        story.append(Spacer(1, 12))

        # 3. Three Evaluation Pillars Breakdown
        story.extend(cls._build_pillars_breakdown(results_dto, styles))
        story.append(Spacer(1, 12))

        # 4. Detailed Answer Dimensions Table
        story.extend(cls._build_dimensions_section(results_dto, styles))
        story.append(Spacer(1, 12))

        # 5. Observable Multimodal Telemetry & Evidence Reliability
        story.extend(cls._build_telemetry_section(results_dto, styles))
        story.append(Spacer(1, 14))

        # 6. Question-by-Question Review
        story.extend(cls._build_questions_review(results_dto, styles))
        story.append(Spacer(1, 12))

        # 7. Final Insights & Scoring Transparency
        story.extend(cls._build_final_insights(results_dto, styles))

        doc.build(story, canvasmaker=NumberedCanvas)
        buffer.seek(0)
        return buffer.getvalue()

    @classmethod
    def _build_stylesheet(cls) -> Dict[str, ParagraphStyle]:
        """Create structured, print-friendly paragraph styles."""
        base = getSampleStyleSheet()

        return {
            "BrandTitle": ParagraphStyle(
                "BrandTitle",
                fontName="Helvetica-Bold",
                fontSize=18,
                leading=22,
                textColor=colors.HexColor("#0F172A"),
            ),
            "BrandSubtitle": ParagraphStyle(
                "BrandSubtitle",
                fontName="Helvetica",
                fontSize=9,
                leading=12,
                textColor=colors.HexColor("#64748B"),
            ),
            "SectionHeader": ParagraphStyle(
                "SectionHeader",
                fontName="Helvetica-Bold",
                fontSize=12,
                leading=16,
                textColor=colors.HexColor("#0F172A"),
                spaceAfter=4,
            ),
            "CardTitle": ParagraphStyle(
                "CardTitle",
                fontName="Helvetica-Bold",
                fontSize=10,
                leading=13,
                textColor=colors.HexColor("#0F172A"),
            ),
            "ScoreBig": ParagraphStyle(
                "ScoreBig",
                fontName="Helvetica-Bold",
                fontSize=28,
                leading=32,
                textColor=colors.HexColor("#059669"),
                alignment=1,  # Centered
            ),
            "CategoryBadge": ParagraphStyle(
                "CategoryBadge",
                fontName="Helvetica-Bold",
                fontSize=10,
                leading=13,
                textColor=colors.HexColor("#047857"),
                alignment=1,
            ),
            "BodySmall": ParagraphStyle(
                "BodySmall",
                fontName="Helvetica",
                fontSize=8.5,
                leading=11.5,
                textColor=colors.HexColor("#334155"),
            ),
            "BodyBold": ParagraphStyle(
                "BodyBold",
                fontName="Helvetica-Bold",
                fontSize=8.5,
                leading=11.5,
                textColor=colors.HexColor("#0F172A"),
            ),
            "MutedSmall": ParagraphStyle(
                "MutedSmall",
                fontName="Helvetica",
                fontSize=8,
                leading=10.5,
                textColor=colors.HexColor("#64748B"),
            ),
            "BulletText": ParagraphStyle(
                "BulletText",
                fontName="Helvetica",
                fontSize=8.5,
                leading=11.5,
                textColor=colors.HexColor("#1E293B"),
                leftIndent=10,
            ),
            "TableHeader": ParagraphStyle(
                "TableHeader",
                fontName="Helvetica-Bold",
                fontSize=8.5,
                leading=11,
                textColor=colors.HexColor("#0F172A"),
            ),
            "TableText": ParagraphStyle(
                "TableText",
                fontName="Helvetica",
                fontSize=8,
                leading=10.5,
                textColor=colors.HexColor("#334155"),
            ),
        }

    @classmethod
    def _build_header(cls, dto: CandidateResultsDTO, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        """Cover Header with branding and interview metadata table."""
        completed_str = dto.completed_at.strftime("%B %d, %Y") if dto.completed_at else datetime.utcnow().strftime("%B %d, %Y")
        duration_str = f"{dto.duration_minutes} Minutes" if dto.duration_minutes else "Completed Session"

        header_table_data = [
            [
                Paragraph("<b>InterviewIQ</b> | Performance Report", styles["BrandTitle"]),
                Paragraph(f"<b>Date:</b> {completed_str}<br/><b>Report:</b> v{REPORT_VERSION}", styles["MutedSmall"]),
            ],
            [
                Paragraph(f"<b>Candidate:</b> {dto.candidate_name} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Role:</b> {dto.job_role} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Type:</b> {dto.interview_type} &nbsp;&nbsp;|&nbsp;&nbsp; <b>Duration:</b> {duration_str}", styles["BrandSubtitle"]),
                Paragraph(f"<b>Session:</b> #{dto.session_id[:8].upper()}", styles["MutedSmall"]),
            ]
        ]

        t = Table(header_table_data, colWidths=[400, 140])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ]))

        return [t, HRFlowable(width="100%", thickness=1, color=colors.HexColor("#059669"), spaceBefore=6, spaceAfter=8)]

    @classmethod
    def _build_executive_score_card(cls, dto: CandidateResultsDTO, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        """Executive score banner displaying score, qualitative category, and deterministic summary."""
        score_box_data = [
            [Paragraph(f"{dto.overall_score:.0f}", styles["ScoreBig"])],
            [Paragraph("OUT OF 100", styles["MutedSmall"])],
            [Paragraph(dto.performance_category.upper(), styles["CategoryBadge"])],
        ]
        score_box = Table(score_box_data, colWidths=[120])
        score_box.setStyle(TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F0FDF4")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#BBF7D0")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
        ]))

        summary_box_data = [
            [Paragraph("<b>Executive Performance Summary</b>", styles["SectionHeader"])],
            [Paragraph(dto.evaluation_summary, styles["BodySmall"])],
        ]
        summary_box = Table(summary_box_data, colWidths=[410])
        summary_box.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
        ]))

        card_table = Table([[score_box, summary_box]], colWidths=[125, 415])
        card_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ]))

        return [card_table]

    @classmethod
    def _build_pillars_breakdown(cls, dto: CandidateResultsDTO, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        """Summary card row comparing Answer Quality, Communication, and Visual Presentation."""
        ans = dto.answer_quality
        comm = dto.communication
        vis = dto.visual_presentation

        def format_pillar(title: str, score: Optional[float], weight: Optional[float], is_avail: bool, expl: str):
            score_txt = f"<b>{score:.1f}</b>/100" if (is_avail and score is not None) else "<i>Not Recorded</i>"
            weight_txt = f"{weight:.0f}% Weight" if (is_avail and weight is not None) else "Renormalized"
            content = [
                [Paragraph(f"<b>{title}</b>", styles["CardTitle"])],
                [Paragraph(score_txt, styles["SectionHeader"])],
                [Paragraph(weight_txt, styles["MutedSmall"])],
                [Spacer(1, 3)],
                [Paragraph(expl, styles["TableText"])],
            ]
            t = Table(content, colWidths=[174])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#E2E8F0")),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            return t

        p1 = format_pillar("Answer Quality", ans.score, ans.applied_weight_pct, True, "Core technical reasoning, accuracy, and structure.")
        p2 = format_pillar(
            "Observable Communication",
            comm.score,
            comm.applied_weight_pct,
            comm.is_available,
            f"Vocal delivery & pacing ({comm.signals.speaking_rate_wpm or 0} WPM)." if comm.is_available else "Audio telemetry unavailable; weight redistributed."
        )
        p3 = format_pillar(
            "Visual Presentation",
            vis.score,
            vis.applied_weight_pct,
            vis.is_available,
            f"Camera presence ({vis.signals.face_presence_pct or 0}%) & framing." if vis.is_available else "Video telemetry unavailable; weight redistributed."
        )

        pillars_row = Table([[p1, p2, p3]], colWidths=[178, 178, 178])
        pillars_row.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 2),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))

        return [
            Paragraph("<b>Evaluation Pillars Breakdown</b>", styles["SectionHeader"]),
            pillars_row,
        ]

    @classmethod
    def _build_dimensions_section(cls, dto: CandidateResultsDTO, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        """5 Core Answer Dimensions Table."""
        dims = dto.answer_quality.dimensions
        if not dims:
            return []

        table_data = [
            [
                Paragraph("<b>Dimension</b>", styles["TableHeader"]),
                Paragraph("<b>Score</b>", styles["TableHeader"]),
                Paragraph("<b>Description & Focus Area</b>", styles["TableHeader"]),
            ]
        ]

        for d in dims:
            table_data.append([
                Paragraph(f"<b>{d.dimension_name}</b>", styles["TableText"]),
                Paragraph(f"<b>{d.score:.1f}%</b>", styles["TableText"]),
                Paragraph(d.description, styles["TableText"]),
            ])

        t = Table(table_data, colWidths=[130, 60, 350])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))

        return [
            Paragraph("<b>Answer Quality Dimension Detail (5 Core Metrics)</b>", styles["SectionHeader"]),
            t,
        ]

    @classmethod
    def _build_telemetry_section(cls, dto: CandidateResultsDTO, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        """Observable Telemetry Signals & Evidence Reliability."""
        comm = dto.communication.signals
        vis = dto.visual_presentation.signals
        rel = dto.evidence_reliability
        cov = dto.evidence_coverage

        telemetry_data = [
            [
                Paragraph("<b>Signal / Sensor Metric</b>", styles["TableHeader"]),
                Paragraph("<b>Observed Value</b>", styles["TableHeader"]),
                Paragraph("<b>Status / Sensor Reliability</b>", styles["TableHeader"]),
            ],
            [
                Paragraph("Answer Coverage", styles["TableText"]),
                Paragraph(f"{cov.answered_questions} of {cov.total_questions} Questions ({cov.completion_percentage}%)", styles["TableText"]),
                Paragraph(f"Reliability: {rel.answer_coverage}", styles["TableText"]),
            ],
            [
                Paragraph("Vocal Cadence & Speaking Rate", styles["TableText"]),
                Paragraph(f"{comm.speaking_rate_wpm or 0} WPM &nbsp;|&nbsp; {comm.speaking_flow or 'Not Recorded'}", styles["TableText"]),
                Paragraph(f"Quality: {rel.communication_quality}", styles["TableText"]),
            ],
            [
                Paragraph("Filler Word Count", styles["TableText"]),
                Paragraph(f"{comm.filler_word_count or 0} Occurrences", styles["TableText"]),
                Paragraph("Evaluated for pacing clarity", styles["TableText"]),
            ],
            [
                Paragraph("Camera Visibility & Presence", styles["TableText"]),
                Paragraph(f"{vis.face_presence_pct or 0}% Face Presence Ratio", styles["TableText"]),
                Paragraph(f"Quality: {rel.visual_quality}", styles["TableText"]),
            ],
            [
                Paragraph("Camera Alignment & Framing", styles["TableText"]),
                Paragraph(f"{vis.camera_alignment_pct or 0}% Centered & Forward Facing", styles["TableText"]),
                Paragraph("Neutral observable framing", styles["TableText"]),
            ],
        ]

        t = Table(telemetry_data, colWidths=[170, 180, 190])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))

        return [
            Paragraph("<b>Observable Telemetry & Evidence Reliability</b>", styles["SectionHeader"]),
            Paragraph(cov.explanation, styles["MutedSmall"]),
            Spacer(1, 4),
            t,
        ]

    @classmethod
    def _build_questions_review(cls, dto: CandidateResultsDTO, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        """Question-by-question performance analysis."""
        elements = [Paragraph(f"<b>Question-by-Question Review ({len(dto.questions)} Questions)</b>", styles["SectionHeader"])]

        for q in dto.questions:
            q_header_text = f"<b>Question {q.question_number} &nbsp;[{q.question_type}]</b>"
            scores_text = f"<b>Answer Score:</b> {q.answer_score:.1f}% &nbsp;&nbsp;|&nbsp;&nbsp; <b>Combined Score:</b> {q.combined_score:.1f}%"

            strengths_str = "<br/>• ".join(q.strengths) if q.strengths else "Demonstrated standard domain concepts."
            improvements_str = "<br/>• ".join(q.improvements) if q.improvements else "Continue practicing structured responses."

            q_data = [
                [
                    Paragraph(q_header_text, styles["CardTitle"]),
                    Paragraph(scores_text, styles["TableText"]),
                ],
                [
                    Paragraph(f"<i>\"{q.question_text}\"</i>", styles["BodySmall"]),
                    Paragraph("", styles["TableText"]),
                ],
                [
                    Paragraph(f"<b>Strengths:</b><br/>• {strengths_str}", styles["TableText"]),
                    Paragraph(f"<b>Areas for Growth:</b><br/>• {improvements_str}", styles["TableText"]),
                ],
            ]

            q_table = Table(q_data, colWidths=[270, 270])
            q_table.setStyle(TableStyle([
                ("SPAN", (0, 1), (1, 1)),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FAFAFA")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.HexColor("#CBD5E1")),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))

            elements.append(KeepTogether([q_table, Spacer(1, 6)]))

        return elements

    @classmethod
    def _build_final_insights(cls, dto: CandidateResultsDTO, styles: Dict[str, ParagraphStyle]) -> List[Any]:
        """Final Strengths, Areas for Improvement, and Scoring Transparency statement."""
        strengths_items = dto.strengths if dto.strengths else ["Structured technical communication and clear logic flow."]
        improvements_items = dto.improvements if dto.improvements else ["Provide deeper production scalability trade-offs."]

        strengths_text = "<br/>• ".join(strengths_items)
        improvements_text = "<br/>• ".join(improvements_items)

        insights_data = [
            [
                Paragraph("<b>Consolidated Strengths</b>", styles["SectionHeader"]),
                Paragraph("<b>Key Areas for Improvement</b>", styles["SectionHeader"]),
            ],
            [
                Paragraph(f"• {strengths_text}", styles["BodySmall"]),
                Paragraph(f"• {improvements_text}", styles["BodySmall"]),
            ],
        ]

        insights_table = Table(insights_data, colWidths=[270, 270])
        insights_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F0FDF4")),
            ("BACKGROUND", (1, 0), (1, -1), colors.HexColor("#FFFBEB")),
            ("BOX", (0, 0), (0, -1), 0.5, colors.HexColor("#BBF7D0")),
            ("BOX", (1, 0), (1, -1), 0.5, colors.HexColor("#FDE68A")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))

        methodology_text = (
            "<b>Scoring Transparency & Methodology:</b> Overall scores are computed through deterministic evidence "
            "synthesis. Answer quality serves as the primary evaluation anchor (70% nominal), combined with observable "
            "communication (15% nominal) and visual presentation (15% nominal) when telemetry is present. In the event "
            "of missing sensor modalities, weights dynamically renormalize across available dimensions rather than "
            "penalizing candidates. This document is certified deterministic, reproducible, and verifiable."
        )

        return [
            KeepTogether([
                Paragraph("<b>Final Insights & Growth Recommendations</b>", styles["SectionHeader"]),
                insights_table,
                Spacer(1, 10),
                Paragraph(methodology_text, styles["MutedSmall"]),
            ])
        ]


report_service = ReportService()
