// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import TaskForm from '../TaskForm.jsx';

describe('TaskForm', () => {
  it('muestra el encabezado correcto cuando se crea una nueva tarea', () => {
    const dummy = () => {};
    const defaultData = {
      title: '',
      desc: '',
      category: 'OTROS',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      long: false,
    };

    render(
      <TaskForm
        formData={defaultData}
        editingId={null}
        handleChange={dummy}
        handleSaveTask={dummy}
        handleDeleteTask={dummy}
        closeModal={dummy}
        setFormData={dummy}
      />
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(/crear nueva tarea/i);
  });
});
