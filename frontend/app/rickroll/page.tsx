"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TheGamePage() {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const handleClick = () => {
    setScore(score + 1);
    if (score + 1 >= 10) setGameOver(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-6 animate-gradient-diagonal">
      
      <div className="w-60 md:h-90 md:w-200">
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
          title="Rick Astley - Never Gonna Give You Up"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>


      <h1 className="text-4xl font-bold mb-6 text-center p-4">🎮 The Game, usted ha sido Rickrolleado 🎮</h1>

      {!gameOver ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-xl">Haz click en el botón para subir tu puntuación:</p>
          <Button size="lg" onClick={handleClick}>
            Click me!
          </Button>
          <p className="text-2xl font-bold mt-2">Score: {score}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-2xl font-bold animate-bounce">🎉 ¡Ganaste un Iphone 17 Pro full HD 4K! 🎉</p>
          <p className="text-lg">Tu puntuación final: {score}</p>
          <p>El equipo de Alquigest se comunicará contigo a la brevedad...</p>
        </div>
      )}

      <Link href="/" className="mt-10">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>
      </Link>
    </div>
  );
}
