<script setup lang="ts">
type BaseEditorProps = {
  id: string;
  label: string;
  placeholder: string;
  modelValue: string | undefined;
  errorMessage?: string | undefined;
};

const props = defineProps<BaseEditorProps>();
const emit = defineEmits(['update:modelValue']);

const editor = useEditor({
  content: props.modelValue,
  extensions: [tiptapStarterKit],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  },
  editorProps: {
    attributes: {
      class:
        'border border-grey-200 rounded-bl-lg rounded-br-lg p-4 min-h-[20rem] max-h-[24rem] overflow-y-auto outline-none prose max-w-none bg-white prose:ul:marker:text-primary-600 ',
    },
  },
});
</script>
<template>
  <div class="mb-6 flex w-full flex-col">
    <p class="text-grey-700 mb-2 text-sm font-medium">{{ label }}</p>

    <div
      v-if="editor"
      class="buttons border-grey-200 text-grey-700 flex flex-wrap items-center gap-x-4 rounded-tl-lg rounded-tr-lg border-l border-r border-t p-2"
    >
      <button
        type="button"
        class="editor-button"
        :disabled="!editor.can().chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <IconFormatBold :font-controlled="false" class="size-[24px]" />
      </button>
      <button
        type="button"
        class="editor-button"
        :disabled="!editor.can().chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <IconFormatItalic :font-controlled="false" class="size-[24px]" />
      </button>
      <button
        type="button"
        class="editor-button"
        :disabled="!editor.can().chain().focus().toggleStrike().run()"
        :class="{ 'is-active': editor.isActive('strike') }"
        @click="editor.chain().focus().toggleStrike().run()"
      >
        <IconFormatStrike :font-controlled="false" class="size-[24px]" />
      </button>

      <button
        type="button"
        class="editor-button"
        :class="{ 'is-active': editor.isActive('paragraph') }"
        @click="editor.chain().focus().setParagraph().run()"
      >
        <IconFormatParagraph :font-controlled="false" class="size-[24px]" />
      </button>
      <button
        type="button"
        class="editor-button"
        :class="{
          'is-active': editor.isActive('heading', { level: 1 }),
        }"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      >
        <IconFormatH1 :font-controlled="false" class="size-[24px]" />
      </button>
      <button
        type="button"
        class="editor-button"
        :class="{
          'is-active': editor.isActive('heading', { level: 2 }),
        }"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      >
        <IconFormatH2 :font-controlled="false" class="size-[24px]" />
      </button>
      <button
        type="button"
        class="editor-button"
        :class="{
          'is-active': editor.isActive('heading', { level: 3 }),
        }"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      >
        <IconFormatH3 :font-controlled="false" class="size-[24px]" />
      </button>
      <button
        type="button"
        class="editor-button"
        :class="{
          'is-active': editor.isActive('heading', { level: 4 }),
        }"
        @click="editor.chain().focus().toggleHeading({ level: 4 }).run()"
      >
        <IconFormatH4 :font-controlled="false" class="size-[24px]" />
      </button>
      <button
        type="button"
        class="editor-button"
        :class="{
          'is-active': editor.isActive('heading', { level: 5 }),
        }"
        @click="editor.chain().focus().toggleHeading({ level: 5 }).run()"
      >
        <IconFormatH5 :font-controlled="false" class="size-[24px]" />
      </button>
      <button
        type="button"
        class="editor-button"
        :class="{
          'is-active': editor.isActive('heading', { level: 6 }),
        }"
        @click="editor.chain().focus().toggleHeading({ level: 6 }).run()"
      >
        <IconFormatH6 :font-controlled="false" class="size-[24px]" />
      </button>
      <button
        type="button"
        class="editor-button"
        :class="{ 'is-active': editor.isActive('bulletList') }"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        <IconFormatBulletList :font-controlled="false" class="size-[24px]" />
      </button>
      <button
        type="button"
        class="editor-button"
        :class="{ 'is-active': editor.isActive('orderedList') }"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        <IconFormatOrderedList :font-controlled="false" class="size-[24px]" />
      </button>

      <button
        type="button"
        class="editor-button"
        :class="{ 'is-active': editor.isActive('blockquote') }"
        @click="editor.chain().focus().toggleBlockquote().run()"
      >
        <IconFormatQuote :font-controlled="false" class="size-[24px]" />
      </button>

      <button
        type="button"
        class="editor-button"
        @click="editor.chain().focus().setHorizontalRule().run()"
      >
        <IconFormatHorizontalRule
          :font-controlled="false"
          class="size-[24px]"
        />
      </button>

      <button
        type="button"
        class="editor-button"
        :disabled="!editor.can().chain().focus().undo().run()"
        @click="editor.chain().focus().undo().run()"
      >
        <IconFormatUndo :font-controlled="false" class="size-[24px]" />
      </button>
      <button
        type="button"
        class="editor-button"
        :disabled="!editor.can().chain().focus().redo().run()"
        @click="editor.chain().focus().redo().run()"
      >
        <IconFormatRedo :font-controlled="false" class="size-[24px]" />
      </button>
    </div>
    <TiptapEditorContent :id="id" :editor="editor" />

    <BaseInputError v-if="errorMessage" :id="id">{{
      errorMessage
    }}</BaseInputError>
  </div>
</template>

<style>
.editor-button {
  @apply text-grey-400 hover:bg-grey-50 hover:text-grey-600 rounded-sm bg-transparent p-2 transition-all duration-300 ease-linear;
}

.tiptap p.is-editor-empty:first-child::before {
  @apply text-grey-200 text-sm;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.tiptap p {
  width: 100%;
  max-width: 100%;
}
</style>
