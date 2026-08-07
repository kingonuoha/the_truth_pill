import { DriveStep } from "driver.js";

export type TourConfig = {
  [tourId: string]: DriveStep[];
};

export const TOUR_DEFINITIONS: TourConfig = {
  "admin-blog-creation": [
    {
      element: "#tour-article-author",
      popover: {
        title: "Who's Posting?",
        description:
          "By default, this will be you! But you can easily tap this dropdown to post an article on behalf of someone else in your team.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-article-title",
      popover: {
        title: "Catchy Main Title",
        description:
          "This is the first thing people read. Ensure your title is punchy and gets immediately to the point.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-article-banner",
      popover: {
        title: "Your Post's Banner",
        description:
          "This is the large, beautiful image that appears at the top of your post. You can upload one from your computer or search our free library right here!",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-article-editor",
      popover: {
        title: "The Writing Canvas",
        description:
          "Here is where the magic happens! Type out your thoughts, add headings, format text, and write the body of your article. We track your word count instantly.",
        side: "top",
        align: "start",
      },
    },
    {
      element: "#tour-article-seo",
      popover: {
        title: "Ranking & Organization",
        description:
          "This tab is super important! Here, you can place your article inside a Category, link it to a Pillar (a fancy sub-category), and give it tags so people can easily find your post.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "#tour-article-save",
      popover: {
        title: "Save & Publish",
        description:
          "All done? Click here to save your work as a draft, or publish it to the world instantly. Happy writing!",
        side: "top",
        align: "end",
      },
    },
  ],
  "admin-categories": [
    {
      element: "#tour-categories-top",
      popover: {
        title: "Welcome to Taxonomy",
        description:
          "This is where you organize the entire structure of your platform's topics. It keeps everything neat and easy to find.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-categories-search",
      popover: {
        title: "Powerful Filtering",
        description:
          "Looking for something specific? You can toggle this search tool to filter by either the actual 'Name' or the 'Category'. It filters the data instantly!",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-categories-creation",
      popover: {
        title: "Constructing New Groups",
        description:
          "Click the blue button to create a broad category, or the purple button to create a deeper 'Pillar' nested inside a category.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#tour-categories-tabs",
      popover: {
        title: "Toggle Views",
        description:
          "Switch back and forth between viewing your top-level Categories and your detailed Knowledge Pillars. Simple and easy!",
        side: "bottom",
        align: "start",
      },
    },
  ],
};
