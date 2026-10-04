import struct
import logging
from typing import Dict, Any, Optional
from app.ai.providers.tts.base import BaseTTSProvider
from app.ai.evaluation.answer.exceptions import AIProviderError, AIProviderTimeoutError

logger = logging.getLogger(__name__)


def generate_synthetic_wav_bytes(duration_sec: float = 1.5, sample_rate: int = 8000) -> bytes:
    """
    Generate a valid 44-byte WAV header and PCM audio buffer for deterministic mock testing.
    """
    num_samples = int(sample_rate * duration_sec)
    data_size = num_samples * 2
    num_channels = 1
    bits_per_sample = 16

    header = struct.pack(
        '<4sI4s4sIHHIIHH4sI',
        b'RIFF',
        36 + data_size,
        b'WAVE',
        b'fmt ',
        16,
        1,  # PCM format
        num_channels,
        sample_rate,
        sample_rate * num_channels * (bits_per_sample // 8),
        num_channels * (bits_per_sample // 8),
        bits_per_sample,
        b'data',
        data_size
    )
    samples = b'\x00\x00' * num_samples
    return header + samples


class MockTTSProvider(BaseTTSProvider):
    """
    Deterministic Mock Text-to-Speech Provider for zero-cost offline testing and unit tests.
    Supports mock modes: 'success', 'empty', 'failure', 'timeout'.
    """

    def __init__(self, mock_mode: str = "success"):
        self.mock_mode = mock_mode

    def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Synthesize input text into deterministic mock audio buffer.
        """
        if self.mock_mode == "failure":
            raise AIProviderError("Mock TTS provider simulated API failure.")
        if self.mock_mode == "timeout":
            raise AIProviderTimeoutError("Mock TTS provider simulated API timeout after 30 seconds.")
        if self.mock_mode == "empty":
            return {
                "audio_bytes": b"",
                "content_type": "audio/wav",
                "language": language or "en",
                "duration_seconds": 0.0,
                "provider": "mock"
            }

        text_len = len((text or "").strip())
        est_duration = max(1.0, round(text_len / 15.0, 1))
        audio_bytes = generate_synthetic_wav_bytes(duration_sec=est_duration)

        return {
            "audio_bytes": audio_bytes,
            "content_type": "audio/wav",
            "language": language or "en",
            "duration_seconds": est_duration,
            "provider": "mock"
        }
