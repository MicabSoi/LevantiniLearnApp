<<<<<<< HEAD
import React, { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';

// Define the expected structure of the 'fields' JSONB column for a basic card
interface CardFields {
  english: string;
  arabic: string;
  transliteration?: string;
  clozeText?: string; // For cloze cards (not implemented in this CardView yet)
  imageUrl?: string; // For image cards (not fully implemented in this CardView yet)
  // Add other fields as needed for specific card types
}

interface CardViewProps {
  card: {
    id: string;
    fields: CardFields;
    audio_url?: string | null; // Add audio_url here
    // layout?: any; // Assuming we render based on simple fields for now
    // type?: 'basic' | 'cloze' | 'image'; // Assuming 'basic' for now
  };
  // Corrected prop type to only expect quality
  onQualitySelect: (quality: number) => void;
}

const CardView: React.FC<CardViewProps> = ({ card, onQualitySelect }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showQualityButtons, setShowQualityButtons] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Add keyboard event handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (showContinuePrompt) {
        // If showing continue prompt, any key will proceed
        onQualitySelect(selectedQuality!);
        return;
      }

      // Only handle quality selection when quality buttons are shown
      if (!showQualityButtons) return;

      // Map number keys to quality ratings
      const qualityMap: { [key: string]: number } = {
        '0': 0, // Blackout
        '1': 1, // Wrong but familiar
        '2': 2, // Hesitation
        '3': 3  // Perfect
      };

      const quality = qualityMap[event.key];
      if (quality !== undefined) {
        handleQualitySelect(quality);
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [showQualityButtons, showContinuePrompt, selectedQuality, onQualitySelect]);

  // Reset state when card changes
  useEffect(() => {
    setIsFlipped(false);
    setShowQualityButtons(false);
    setSelectedQuality(null);
    setShowContinuePrompt(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, [card]);

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      // Show quality buttons immediately after flip
      setShowQualityButtons(true);
      // Autoplay audio on flip if available
      if (card.audio_url) {
        playAudio(card.audio_url);
      }
    }
  };

  const handleQualitySelect = (quality: number) => {
    setSelectedQuality(quality);
    setShowContinuePrompt(true);
  };

  const handleUndo = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the click from triggering continue
    setSelectedQuality(null);
    setShowContinuePrompt(false);
    setShowQualityButtons(true);
  };

  const handleContinue = () => {
    if (showContinuePrompt) {
      onQualitySelect(selectedQuality!);
    }
  };

  const getQualityLabel = (quality: number) => {
    const labels = {
      0: 'Blackout',
      1: 'Wrong but familiar',
      2: 'Hesitation',
      3: 'Perfect'
    };
    return labels[quality as keyof typeof labels];
  };

  const getQualityColor = (quality: number) => {
    const colors = {
      0: 'bg-red-500',
      1: 'bg-orange-500',
      2: 'bg-yellow-500',
      3: 'bg-green-500'
    };
    return colors[quality as keyof typeof colors];
  };

  const playAudio = (audioUrl: string) => {
    try {
      if (!audioUrl) return;

      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onerror = (e) => {
          console.error('Audio failed to load:', e);
        };
      } else {
        audioRef.current.src = audioUrl;
      }

      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.7; // Adjust volume if needed
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Error playing audio:', error);
        });
      }
    } catch (error) {
      console.error('Error in playAudio function:', error);
    }
  };

  const renderFront = () => (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-gray-100 dark:bg-dark-100 rounded-t-lg">
      <p className="text-2xl font-bold text-center text-gray-900 dark:text-white">
        {card.fields.english}
      </p>
      {/* Add image rendering here if card type is 'image' */}
      {/* {card.type === 'image' && card.fields.imageUrl && (
        <img src={card.fields.imageUrl} alt="Flashcard front" className="mt-4 max-h-40 object-contain" />
      )} */}
    </div>
  );

  const renderBack = () => (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-gray-50 dark:bg-dark-200 rounded-t-lg">
      {card.fields.arabic && (
        <p
          dir="rtl"
          className="text-3xl font-bold text-center text-gray-900 dark:text-white"
        >
          {card.fields.arabic}
        </p>
      )}
      {card.fields.transliteration && (
        <p className="text-lg text-gray-600 dark:text-gray-400 text-center mt-2">
          ({card.fields.transliteration})
        </p>
      )}
      {/* Add cloze text rendering here if card type is 'cloze' */}
      {/* {card.type === 'cloze' && (
         <p className="text-xl font-bold text-center text-gray-900 dark:text-white mt-4">
           {card.fields.clozeText} // Render with blanks filled? Or originally with blanks? Depends on layout logic.
         </p>
      )} */}
      {/* Add image rendering here if card type is 'image' */}
      {/* {card.type === 'image' && card.fields.imageUrl && (
        <img src={card.fields.imageUrl} alt="Flashcard back" className="mt-4 max-h-40 object-contain" />
      )} */}

      {card.audio_url && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent flip if clicking audio
            playAudio(card.audio_url!);
          }}
          className="mt-4 p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200"
        >
          <Volume2 size={20} />
        </button>
      )}
    </div>
  );

  return (
    <div 
      className="max-w-md mx-auto bg-white dark:bg-dark-200 rounded-lg shadow-xl overflow-hidden"
      onClick={handleContinue}
    >
      {/* Card Content Area */}
      <div onClick={handleFlip} className="cursor-pointer">
        {isFlipped ? renderBack() : renderFront()}
      </div>

      {/* Selected Quality Display */}
      {selectedQuality !== null && (
        <div className="p-4 bg-gray-50 dark:bg-dark-100 border-t border-gray-200 dark:border-dark-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-2 rounded-md ${getQualityColor(selectedQuality)} text-white mr-3`}>
                {selectedQuality}
              </div>
              <span className="text-gray-700 dark:text-gray-300">
                {getQualityLabel(selectedQuality)}
              </span>
            </div>
            <button
              onClick={handleUndo}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Undo
            </button>
          </div>
          {showContinuePrompt && (
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Press any key or tap anywhere to continue
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quality Buttons */}
      {showQualityButtons && selectedQuality === null && (
        <div className="p-4 grid grid-cols-4 gap-3 mt-4">
          {/* Quality 0 button - Blackout */}
          <button
            onClick={() => handleQualitySelect(0)}
            className="p-3 rounded-md bg-red-500 text-white text-xs font-bold hover:bg-red-600"
          >
            0<span className="block font-normal text-gray-200">Blackout</span>
          </button>
          {/* Quality 1 button - Wrong but familiar */}
          <button
            onClick={() => handleQualitySelect(1)}
            className="p-3 rounded-md bg-orange-500 text-white text-xs font-bold hover:bg-orange-600"
          >
            1
            <span className="block font-normal text-gray-200">
              Wrong but familiar
            </span>
          </button>
          {/* Quality 2 button - Correct after hesitation */}
          <button
            onClick={() => handleQualitySelect(2)}
            className="p-3 rounded-md bg-yellow-500 text-white text-xs font-bold hover:bg-yellow-600"
          >
            2<span className="block font-normal text-gray-800">Hesitation</span>
          </button>
          {/* Quality 3 button - Perfect recall */}
          <button
            onClick={() => handleQualitySelect(3)}
            className="p-3 rounded-md bg-green-500 text-white text-xs font-bold hover:bg-green-600"
          >
            3<span className="block font-normal text-gray-200">Perfect</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CardView;
=======
import React, { useState, useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';

// Define the expected structure of the 'fields' JSONB column for a basic card
interface CardFields {
  english: string;
  arabic: string;
  transliteration?: string;
  clozeText?: string; // For cloze cards (not implemented in this CardView yet)
  imageUrl?: string; // For image cards (not fully implemented in this CardView yet)
  // Add other fields as needed for specific card types
}

interface CardViewProps {
  card: {
    id: string;
    fields: CardFields;
    audio_url?: string | null; // Add audio_url here
    // layout?: any; // Assuming we render based on simple fields for now
    // type?: 'basic' | 'cloze' | 'image'; // Assuming 'basic' for now
  };
  // Corrected prop type to only expect quality
  onQualitySelect: (quality: number) => void;
}

const CardView: React.FC<CardViewProps> = ({ card, onQualitySelect }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showQualityButtons, setShowQualityButtons] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset state when card changes
  useEffect(() => {
    setIsFlipped(false);
    setShowQualityButtons(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, [card]);

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      // Show quality buttons after a slight delay
      setTimeout(() => {
        setShowQualityButtons(true);
        // Autoplay audio on flip if available
        if (card.audio_url) {
          playAudio(card.audio_url);
        }
      }, 300); // Adjust delay as needed
    }
    // Flipping back is not typically done in a standard review session flow,
    // but you could add logic here if needed.
  };

  const handleQualitySelect = (quality: number) => {
    // Corrected call to match the updated prop type
    onQualitySelect(quality); // Call the parent handler
  };

  const playAudio = (audioUrl: string) => {
    try {
      if (!audioUrl) return;

      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onerror = (e) => {
          console.error('Audio failed to load:', e);
        };
      } else {
        audioRef.current.src = audioUrl;
      }

      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.7; // Adjust volume if needed
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Error playing audio:', error);
        });
      }
    } catch (error) {
      console.error('Error in playAudio function:', error);
    }
  };

  const renderFront = () => (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-gray-100 dark:bg-dark-100 rounded-t-lg">
      <p className="text-2xl font-bold text-center text-gray-900 dark:text-white">
        {card.fields.english}
      </p>
      {/* Add image rendering here if card type is 'image' */}
      {/* {card.type === 'image' && card.fields.imageUrl && (
        <img src={card.fields.imageUrl} alt="Flashcard front" className="mt-4 max-h-40 object-contain" />
      )} */}
    </div>
  );

  const renderBack = () => (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-gray-50 dark:bg-dark-200 rounded-t-lg">
      {card.fields.arabic && (
        <p
          dir="rtl"
          className="text-3xl font-bold text-center text-gray-900 dark:text-white"
        >
          {card.fields.arabic}
        </p>
      )}
      {card.fields.transliteration && (
        <p className="text-lg text-gray-600 dark:text-gray-400 text-center mt-2">
          ({card.fields.transliteration})
        </p>
      )}
      {/* Add cloze text rendering here if card type is 'cloze' */}
      {/* {card.type === 'cloze' && (
         <p className="text-xl font-bold text-center text-gray-900 dark:text-white mt-4">
           {card.fields.clozeText} // Render with blanks filled? Or originally with blanks? Depends on layout logic.
         </p>
      )} */}
      {/* Add image rendering here if card type is 'image' */}
      {/* {card.type === 'image' && card.fields.imageUrl && (
        <img src={card.fields.imageUrl} alt="Flashcard back" className="mt-4 max-h-40 object-contain" />
      )} */}

      {card.audio_url && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent flip if clicking audio
            playAudio(card.audio_url!);
          }}
          className="mt-4 p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200"
        >
          <Volume2 size={20} />
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-dark-200 rounded-lg shadow-xl overflow-hidden">
      {/* Card Content Area */}
      <div onClick={handleFlip} className="cursor-pointer">
        {isFlipped ? renderBack() : renderFront()}
      </div>

      {/* Quality Buttons */}
      {showQualityButtons && (
        <div className="p-4 grid grid-cols-4 gap-3 mt-4">
          {/* Quality 0 button - Blackout */}
          <button
            onClick={() => handleQualitySelect(0)}
            className="p-3 rounded-md bg-red-500 text-white text-xs font-bold hover:bg-red-600"
          >
            0<span className="block font-normal text-gray-200">Blackout</span>
          </button>
          {/* Quality 1 button - Wrong but familiar */}
          <button
            onClick={() => handleQualitySelect(1)}
            className="p-3 rounded-md bg-orange-500 text-white text-xs font-bold hover:bg-orange-600"
          >
            1
            <span className="block font-normal text-gray-200">
              Wrong but familiar
            </span>
          </button>
          {/* Quality 2 button - Correct after hesitation */}
          <button
            onClick={() => handleQualitySelect(2)}
            className="p-3 rounded-md bg-yellow-500 text-white text-xs font-bold hover:bg-yellow-600"
          >
            2<span className="block font-normal text-gray-800">Hesitation</span>
          </button>
          {/* Quality 3 button - Perfect recall */}
          <button
            onClick={() => handleQualitySelect(3)}
            className="p-3 rounded-md bg-green-500 text-white text-xs font-bold hover:bg-green-600"
          >
            3<span className="block font-normal text-gray-200">Perfect</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CardView;
>>>>>>> 4ddb881d48eae57f08464140abafcc7192e0bc00
