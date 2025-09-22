import React from "react";
import "./coffee-ui.css";

import roomBg from "../assets/images/ingredientroom.png";
import asamJawaImg from "../assets/ingredients/asam_jawa.png";
import berasImg from "../assets/ingredients/beras.png";
import jaheImg from "../assets/ingredients/jahe.png";
import kencurImg from "../assets/ingredients/kencur.png";
import kunyitImg from "../assets/ingredients/kunyit.png";
import maduImg from "../assets/ingredients/madu.png";
import serehImg from "../assets/ingredients/sereh.png";
import temulawakImg from "../assets/ingredients/temulawak.png";

const INGREDIENTS = [
  { key: "beras",      label: "Beras",      image: berasImg,      row: 1, col: 1 },
  { key: "kunyit",     label: "Kunyit",     image: kunyitImg,     row: 1, col: 2 },
  { key: "jahe",       label: "Jahe",       image: jaheImg,       row: 1, col: 3 },
  { key: "temulawak",  label: "Temulawak",  image: temulawakImg,  row: 1, col: 4 },
  { key: "kencur",     label: "Kencur",     image: kencurImg,     row: 2, col: 1 },
  { key: "asam_jawa",  label: "Asam Jawa",  image: asamJawaImg,   row: 2, col: 2 },
  { key: "sereh",      label: "Sereh",      image: serehImg,      row: 2, col: 3 },
  { key: "madu",       label: "Madu",       image: maduImg,       row: 2, col: 4 },
];

export default function IngredientRoom({ onPick }) {
  return (
    <div className="panel ingredient-room">
      <div className="ingredient-room__bg" style={{ backgroundImage: `url(${roomBg})` }} />

      <div className="ingredient-room__grid">
        {INGREDIENTS.map((item) => (
          <button
            key={item.key}
            className="ingredient-room__item"
            onClick={() => onPick?.(item.key)}
            style={{ gridColumn: item.col, gridRow: item.row }}
            title={item.label}
          >
            <img className="ingredient-room__item-img" src={item.image} alt={item.label} />
            <span className="ingredient-room__item-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
