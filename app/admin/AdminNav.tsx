"use client";

import { useEffect, useState } from "react";

const navItems = [
  { href: "#resumen", label: "Resumen" },
  { href: "#usuarios", label: "Usuarios" },
  { href: "#contenido", label: "Contenido" },
  { href: "#anuncios", label: "Anuncios" },
  { href: "#partners", label: "Partners" },
  { href: "#moderacion", label: "Moderacion" },
];

export function AdminNav() {
  const [activeSection, setActiveSection] = useState("resumen");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -65% 0px",
        threshold: [0.1, 0.25, 0.5],
      },
    );

    navItems.forEach((item) => {
      const section = document.querySelector(item.href);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <nav className="admin-nav" aria-label="Menu administrativo">
      {navItems.map((item) => {
        const id = item.href.replace("#", "");

        return (
          <a
            className={activeSection === id ? "active" : undefined}
            href={item.href}
            key={item.href}
            onClick={() => setActiveSection(id)}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
