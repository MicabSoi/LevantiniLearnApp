import React, { useState, useEffect } from 'react';

interface Word {
  id: number;
  arabic: string;
  transliteration: string;
  englishMeaning: string;
  dateMade: string;
  isEditing?: boolean;
}

interface VocabularyLandingProps {
  setActiveTab: (tab: string) => void;
}

const VocabularyLanding: React.FC<VocabularyLandingProps> = ({
  setActiveTab,
}) => {
  const [words, setWords] = useState<Word[]>(() => {
    const savedWords = localStorage.getItem('Vocabulary');
    return savedWords ? JSON.parse(savedWords) : [];
  });
  const [arabic, setArabic] = useState('');
  const [transliteration, setTransliteration] = useState('');
  const [englishMeaning, setEnglishMeaning] = useState('');
  const [error, setError] = useState('');

  // Save words to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('Vocabulary', JSON.stringify(words));
  }, [words]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!englishMeaning) {
      setError('English Meaning is required.');
      return;
    }

    if (!transliteration && !arabic) {
      setError('Either Transliteration or Arabic must be filled.');
      return;
    }

    const newWord: Word = {
      id: Date.now(),
      arabic,
      transliteration,
      englishMeaning,
      dateMade: new Date().toLocaleDateString('en-GB'),
      isEditing: false,
    };

    setWords((prev) => [newWord, ...prev]);
    setArabic('');
    setTransliteration('');
    setEnglishMeaning('');
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-2">Vocabulary</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Build your Levantine Arabic vocabulary
      </p>

      {/* Options Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div
          className="p-4 bg-gray-100 dark:bg-dark-100 rounded cursor-pointer"
          onClick={() => setActiveTab('wordbank')}
        >
          <h3 className="font-bold">Word Bank</h3>
          <p className="text-sm text-gray-600">Review and manage your words</p>
        </div>
        <div
          className="p-4 bg-gray-100 dark:bg-dark-100 rounded cursor-pointer"
          onClick={() => setActiveTab('flashcards')}
        >
          <h3 className="font-bold">Flashcards</h3>
          <p className="text-sm text-gray-600">Practice with flashcards</p>
        </div>
        <div
          className="p-4 bg-gray-100 dark:bg-dark-100 rounded cursor-pointer"
          onClick={() => setActiveTab('dictionary')}
        >
          <h3 className="font-bold">Travel Dictionary</h3>
          <p className="text-sm text-gray-600">Explore new words</p>
        </div>
        <div
          className="p-4 bg-gray-100 dark:bg-dark-100 rounded cursor-pointer"
          onClick={() => setActiveTab('comprehension')}
        >
          <h3 className="font-bold">Daily Words</h3>
          <p className="text-sm text-gray-600">Learn daily vocabulary</p>
        </div>
      </div>
    </div>
  );
};

export default VocabularyLanding;


